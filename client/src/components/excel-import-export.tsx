import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ImportResult {
  success: boolean;
  imported: number;
  total: number;
  errors: { row: number; error: string }[];
}

export function ExcelImportExport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/clients/export/template");
      if (!response.ok) {
        throw new Error("Failed to download template");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "CRM_Import_Template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Template Downloaded",
        description: "The Excel template has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({
        title: "Invalid File",
        description: "Please select an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/clients/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Import failed");
      }

      const result: ImportResult = await response.json();
      setImportResult(result);

      if (result.imported > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.imported} of ${result.total} clients.`,
        });
      }

      if (result.errors.length > 0) {
        toast({
          title: "Import Completed with Errors",
          description: `${result.errors.length} row(s) had errors. Check the details below.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import the file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Excel Import / Export
        </CardTitle>
        <CardDescription>
          Download the template, fill in your client data, and upload to import
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="flex-1 gap-2"
            data-testid="button-download-template"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file-upload"
          />
          
          <Button
            onClick={handleUploadClick}
            disabled={isImporting}
            className="flex-1 gap-2"
            data-testid="button-upload-excel"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Excel
              </>
            )}
          </Button>
        </div>

        {importResult && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              {importResult.errors.length === 0 ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">
                Import Results: {importResult.imported} of {importResult.total} clients imported
              </span>
            </div>
            
            {importResult.errors.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium text-destructive">Errors:</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {importResult.errors.map((err, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">
                      Row {err.row}: {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Instructions:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Download the Excel template</li>
            <li>Fill in your client data (see Instructions sheet for valid values)</li>
            <li>Delete the sample row</li>
            <li>Upload the completed Excel file</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
