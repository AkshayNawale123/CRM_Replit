import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { PipelineTracker } from "@/components/pipeline-tracker";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { Client } from "@shared/schema";

export default function Pipeline() {
  const { data: clients = [], isLoading, error } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navigation />
      <div className="border-b bg-background px-4 py-3">
        <h1 className="text-2xl font-semibold text-foreground">
          Pipeline Tracker
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Visualize client progress through your sales pipeline
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
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
          <div className="max-w-7xl mx-auto">
            <PipelineTracker 
              clients={clients}
              showClientSelector={true}
              defaultViewMode="compact"
            />
          </div>
        )}
      </div>
    </div>
  );
}
