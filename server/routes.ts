import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, addActivitySchema } from "@shared/schema";
import { generateExcelTemplate, parseExcelFile } from "./excel-utils";
import multer from "multer";

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

  // Excel import/export endpoints
  app.get("/api/clients/export/template", (_req, res) => {
    try {
      const buffer = generateExcelTemplate();
      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="CRM_Import_Template.xlsx"',
      });
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/clients/import", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const clients = parseExcelFile(req.file.buffer);
      const createdClients = [];
      const errors = [];

      for (let i = 0; i < clients.length; i++) {
        try {
          const validatedData = insertClientSchema.parse(clients[i]);
          const createdClient = await storage.createClient(validatedData);
          createdClients.push(createdClient);
        } catch (error) {
          errors.push({
            row: i + 2,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      res.json({
        success: true,
        imported: createdClients.length,
        total: clients.length,
        errors,
        clients: createdClients,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to import clients" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
