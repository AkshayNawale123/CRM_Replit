import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, addActivitySchema } from "@shared/schema";
import { generateExcelTemplate, parseExcelFile, validateExcelFile } from "./excel-utils";
import multer from "multer";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/clients", async (_req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid client data", details: error });
      }
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid client data", details: error });
      }
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  app.post("/api/clients/:id/activities", async (req, res) => {
    try {
      const validatedData = addActivitySchema.parse(req.body);
      const client = await storage.addActivity(req.params.id, validatedData);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid activity data", details: error });
      }
      res.status(500).json({ error: "Failed to add activity" });
    }
  });

  app.delete("/api/clients/:id/activities/:activityId", async (req, res) => {
    try {
      const client = await storage.deleteActivity(req.params.id, req.params.activityId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  app.get("/api/clients/export/template", (_req, res) => {
    try {
      const buffer = generateExcelTemplate();
      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="CRM_Import_Template.xlsx"',
      });
      res.send(buffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Please upload an Excel file (.xlsx or .xls)'));
      }
    }
  });

  app.post("/api/clients/import", upload.single("file"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const validation = validateExcelFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const parsedClients = parseExcelFile(req.file.buffer);
      
      if (parsedClients.length === 0) {
        return res.status(400).json({ error: "No data found in the Excel file" });
      }

      const createdClients = [];
      const errors: { row: number; field?: string; error: string }[] = [];

      for (let i = 0; i < parsedClients.length; i++) {
        const rowNum = i + 2;
        const client = parsedClients[i];
        
        if (!client.companyName || client.companyName.trim() === '') {
          errors.push({ row: rowNum, field: 'Company Name', error: 'Company name is required' });
          continue;
        }
        if (!client.contactPerson || client.contactPerson.trim() === '') {
          errors.push({ row: rowNum, field: 'Contact Person', error: 'Contact person is required' });
          continue;
        }
        if (!client.email || !client.email.includes('@')) {
          errors.push({ row: rowNum, field: 'Email', error: 'Valid email is required' });
          continue;
        }
        if (!client.phone || client.phone.trim() === '') {
          errors.push({ row: rowNum, field: 'Phone', error: 'Phone number is required' });
          continue;
        }
        if (!client.country || client.country.trim() === '') {
          errors.push({ row: rowNum, field: 'Country', error: 'Country is required' });
          continue;
        }

        try {
          const clientData = {
            companyName: client.companyName,
            contactPerson: client.contactPerson,
            email: client.email,
            phone: client.phone,
            stage: client.stage,
            status: client.status,
            value: client.value,
            priority: client.priority,
            responsiblePerson: client.responsiblePerson,
            country: client.country,
            linkedin: client.linkedin,
            notes: client.notes,
            lastFollowUp: client.lastFollowUp,
            nextFollowUp: client.nextFollowUp,
            activityHistory: [],
          };
          
          const validatedData = insertClientSchema.parse(clientData);
          const pipelineStartDate = new Date(client.lastFollowUp);
          const createdClient = await storage.createClient({ ...validatedData, pipelineStartDate });
          createdClients.push(createdClient);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Validation failed";
          errors.push({ row: rowNum, error: errorMessage });
        }
      }

      res.json({
        success: createdClients.length > 0,
        imported: createdClients.length,
        total: parsedClients.length,
        errors,
        clients: createdClients,
      });
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to import clients";
      res.status(500).json({ error: errorMessage });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
