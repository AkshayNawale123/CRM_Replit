import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/metric-card";
import { Navigation } from "@/components/navigation";
import { Users, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react";
import type { Client } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ClientTable } from "@/components/client-table";
import { ClientDetailsDialog } from "@/components/client-details-dialog";
import { useState } from "react";

export default function Reports() {
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();

  const { data: clients = [], isLoading, error } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setDetailsDialogOpen(true);
  };

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
      <Navigation />
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="mx-auto px-4 py-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Client Reports
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              High-level view of all client relationships and project stages
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-4 mb-1" />
                  <Skeleton className="h-8 w-16 mb-0.5" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive font-medium mb-1">Failed to load metrics</p>
              <p className="text-sm text-muted-foreground">Unable to fetch client data</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
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

        <div>
          {isLoading ? (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-destructive font-medium mb-1">Failed to load clients</p>
                <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
              </CardContent>
            </Card>
          ) : (
            <ClientTable clients={clients} onEditClient={handleViewDetails} />
          )}
        </div>
      </div>

      <ClientDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        client={selectedClient || null}
      />
    </div>
  );
}
