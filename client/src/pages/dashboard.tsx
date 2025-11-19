import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ClientListPanel } from "@/components/client-list-panel";
import { ClientManagementPanel } from "@/components/client-management-panel";
import { Navigation } from "@/components/navigation";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Client, InsertClient } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'create'>('view');
  const { toast } = useToast();

  const { data: clients = [], isLoading, error } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertClient) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setPanelMode('view');
      toast({
        title: "Success",
        description: "Client added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add client. Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertClient }) =>
      apiRequest("PUT", `/api/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setPanelMode('view');
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update client. Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setSelectedClient(undefined);
      setPanelMode('view');
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertClient) => {
    if (selectedClient && panelMode === 'edit') {
      updateMutation.mutate({ id: selectedClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (selectedClient) {
      deleteMutation.mutate(selectedClient.id);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setPanelMode('view');
  };

  const handleAddClient = () => {
    setSelectedClient(undefined);
    setPanelMode('create');
  };

  const handleCancel = () => {
    if (panelMode === 'create') {
      setSelectedClient(undefined);
    }
    setPanelMode('view');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navigation />
      <div className="border-b bg-background">
        <div className="p-4 md:p-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
              CRM Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage all client relationships and deal pipeline
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Skeleton className="h-8 w-32 mb-2 mx-auto" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-destructive font-medium mb-2">Failed to load clients</p>
                <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
              <ClientListPanel
                clients={clients}
                selectedClientId={selectedClient?.id}
                onSelectClient={handleSelectClient}
                onAddClient={handleAddClient}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={65} minSize={50}>
              <ClientManagementPanel
                client={selectedClient}
                onSubmit={handleSubmit}
                onDelete={selectedClient ? handleDelete : undefined}
                onCancel={handleCancel}
                isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                mode={panelMode}
                onChangeMode={setPanelMode}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
