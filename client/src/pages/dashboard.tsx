import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/metric-card";
import { ClientTable } from "@/components/client-table";
import { ClientDialog } from "@/components/client-dialog";
import { Users, CheckCircle, Clock, XCircle, DollarSign, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Client, InsertClient } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: clients = [], isLoading, error } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.companyName.toLowerCase().includes(query) ||
        client.contactPerson.toLowerCase().includes(query) ||
        client.stage.toLowerCase().includes(query) ||
        (client.status && client.status.toLowerCase().includes(query)) ||
        client.priority.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const createMutation = useMutation({
    mutationFn: (data: InsertClient) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setDialogOpen(false);
      setSelectedClient(undefined);
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
      setDialogOpen(false);
      setSelectedClient(undefined);
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
      setDialogOpen(false);
      setSelectedClient(undefined);
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
    if (selectedClient) {
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

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleAddClient = () => {
    setSelectedClient(undefined);
    setDialogOpen(true);
  };

  const isMetricsLoading = isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  
  const totalClients = clients.length;
  const wonCount = clients.filter((c) => c.stage === "Won").length;
  const inNegotiationCount = clients.filter((c) => c.status === "In Negotiation").length;
  const rejectedCount = clients.filter((c) => c.status === "Proposal Rejected").length;
  const totalPipeline = clients.reduce((sum, c) => sum + c.value, 0);

  const formatPipeline = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-foreground" data-testid="text-page-title">
                  Executive CRM Dashboard
                </h1>
                <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
                  High-level view of all client relationships and project stages
                </p>
              </div>
              <Button
                onClick={handleAddClient}
                className="gap-2"
                data-testid="button-add-client"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-5 mb-2" />
                  <Skeleton className="h-10 w-20 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-destructive font-medium mb-2">Failed to load metrics</p>
              <p className="text-sm text-muted-foreground">Unable to fetch client data</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 transition-opacity ${isMetricsLoading ? 'opacity-50' : 'opacity-100'}`}>
            <MetricCard
              title="Total Clients"
              value={totalClients}
              icon={Users}
              variant="default"
            />
            <MetricCard
              title="Won"
              value={wonCount}
              icon={CheckCircle}
              variant="success"
            />
            <MetricCard
              title="In Negotiation"
              value={inNegotiationCount}
              icon={Clock}
              variant="warning"
            />
            <MetricCard
              title="Rejected"
              value={rejectedCount}
              icon={XCircle}
              variant="danger"
            />
            <MetricCard
              title="Total Pipeline"
              value={formatPipeline(totalPipeline)}
              icon={DollarSign}
              variant="info"
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-foreground" data-testid="text-section-title">
              All Clients
            </h2>
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 flex-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-destructive font-medium mb-2">Failed to load clients</p>
                <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
              </CardContent>
            </Card>
          ) : (
            <ClientTable clients={filteredClients} onEditClient={handleEditClient} />
          )}
        </div>
      </div>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        onDelete={selectedClient ? handleDelete : undefined}
        client={selectedClient}
        isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
