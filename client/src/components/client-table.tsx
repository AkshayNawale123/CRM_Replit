import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StageBadge } from "./stage-badge";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { ChevronRight } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { Client } from "@shared/schema";

interface ClientTableProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
}

export function ClientTable({ clients, onEditClient }: ClientTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "MM/dd/yyyy");
  };

  const getDaysInPipeline = (createdAt: Date | string) => {
    const createdDate = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
    const today = new Date();
    const days = differenceInDays(today, createdDate);
    return Math.max(0, days);
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="font-semibold">Stage</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Value</TableHead>
              <TableHead className="font-semibold">Last Follow-up</TableHead>
              <TableHead className="font-semibold">Responsible Person</TableHead>
              <TableHead className="font-semibold">Country</TableHead>
              <TableHead className="font-semibold">Priority</TableHead>
              <TableHead className="font-semibold text-center">Days in Pipeline</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  No clients found. Add your first client to get started.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => {
                return (
                  <TableRow 
                    key={client.id} 
                    className="hover-elevate"
                    data-testid={`row-client-${client.id}`}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground" data-testid={`text-company-${client.id}`}>
                          {client.companyName}
                        </span>
                        <span className="text-sm text-muted-foreground" data-testid={`text-contact-${client.id}`}>
                          {client.contactPerson}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StageBadge stage={client.stage as any} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={client.status as any} />
                    </TableCell>
                    <TableCell className="text-right font-semibold" data-testid={`text-value-${client.id}`}>
                      {formatCurrency(client.value)}
                    </TableCell>
                    <TableCell className="text-muted-foreground" data-testid={`text-last-followup-${client.id}`}>
                      {formatDate(client.lastFollowUp)}
                    </TableCell>
                    <TableCell className="text-muted-foreground" data-testid={`text-responsible-${client.id}`}>
                      {client.responsiblePerson}
                    </TableCell>
                    <TableCell className="text-muted-foreground" data-testid={`text-country-${client.id}`}>
                      {client.country}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={client.priority as any} />
                    </TableCell>
                    <TableCell className="text-center font-semibold text-foreground" data-testid={`text-days-pipeline-${client.id}`}>
                      {getDaysInPipeline(client.createdAt)} days
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClient(client)}
                        className="gap-1"
                        data-testid={`button-details-${client.id}`}
                      >
                        Details
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
