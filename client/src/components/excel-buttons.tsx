import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ValidationWarning {
  row: number;
  field: string;
  warning: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  total: number;
  errors: { row: number; field?: string; error: string }[];
  warnings?: ValidationWarning[];
}

export function ExcelButtons() {
  const [isImporting, setIsImporting] = useState(false);
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

      if (result.imported > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.imported} of ${result.total} clients.`,
        });
      }

      if (result.warnings && result.warnings.length > 0) {
        const warningCount = result.warnings.length;
        const firstWarning = result.warnings[0];
        toast({
          title: "Import Completed with Warnings",
          description: `${warningCount} row(s) have stage-status compatibility issues. Row ${firstWarning.row}: ${firstWarning.warning}`,
        });
      }

      if (result.errors.length > 0) {
        toast({
          title: "Import Completed with Errors",
          description: `${result.errors.length} row(s) had errors. Please check the data and try again.`,
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
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadTemplate}
        className="gap-2"
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
        size="sm"
        onClick={handleUploadClick}
        disabled={isImporting}
        className="gap-2"
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
  );
}
