import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StageBadge } from "./stage-badge";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { Client } from "@shared/schema";
import { convertToINR, formatINR, formatCurrencyByCountry } from "@/lib/country-currency-data";

type SortField = 'companyName' | 'stage' | 'status' | 'value' | 'valueINR' | 'lastFollowUp' | 'responsiblePerson' | 'country' | 'service' | 'priority' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface ClientTableProps {
  clients: Client[];
  onRowClick: (client: Client) => void;
  selectedClientId?: string;
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
}

export function ClientTable({ clients, onRowClick, selectedClientId, sortField, sortOrder, onSort }: ClientTableProps) {
  const formatValueByCountry = (value: number, country: string) => {
    return formatCurrencyByCountry(value, country);
  };

  const formatValueINR = (value: number, country: string) => {
    const inrValue = convertToINR(value, country);
    return formatINR(inrValue);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "MM/dd/yyyy");
  };

  const getDaysInPipeline = (pipelineStartDate: Date | string | undefined, createdAt: Date | string) => {
    const startDate = pipelineStartDate 
      ? (typeof pipelineStartDate === "string" ? new Date(pipelineStartDate) : pipelineStartDate)
      : (typeof createdAt === "string" ? new Date(createdAt) : createdAt);
    const today = new Date();
    const days = differenceInDays(today, startDate);
    return Math.max(0, days);
  };

  const SortableHeader = ({ 
    field, 
    children, 
    align = 'left' 
  }: { 
    field: SortField; 
    children: React.ReactNode;
    align?: 'left' | 'right' | 'center';
  }) => {
    const isActive = sortField === field;
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : '';
    
    const SortIcon = () => {
      if (!isActive) {
        return <ArrowUpDown className="h-3 w-3" />;
      }
      return sortOrder === 'asc' ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      );
    };
    
    return (
      <TableHead 
        className={`font-semibold py-2 px-3 text-xs ${alignClass}`}
      >
        {onSort ? (
          <button
            onClick={() => onSort(field)}
            className={`flex items-center gap-1 hover-elevate active-elevate-2 px-2 py-1 rounded-md transition-colors ${
              align === 'right' ? 'ml-auto' : align === 'center' ? 'mx-auto' : ''
            } ${
              isActive ? 'text-primary font-bold' : 'text-foreground'
            }`}
            data-testid={`button-sort-${field}`}
          >
            {children}
            <SortIcon />
          </button>
        ) : (
          <span>{children}</span>
        )}
      </TableHead>
    );
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50">
            <TableRow>
              <SortableHeader field="companyName">Client</SortableHeader>
              <SortableHeader field="stage">Stage</SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
              <SortableHeader field="value" align="right">Value</SortableHeader>
              <SortableHeader field="valueINR" align="right">Value (₹)</SortableHeader>
              <SortableHeader field="lastFollowUp">Last Follow-up</SortableHeader>
              <SortableHeader field="responsiblePerson">Responsible Person</SortableHeader>
              <SortableHeader field="country">Country</SortableHeader>
              <SortableHeader field="service">Service</SortableHeader>
              <SortableHeader field="priority">Priority</SortableHeader>
              <SortableHeader field="createdAt" align="center">Days in Pipeline</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No clients found. Add your first client to get started.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => {
                const isSelected = selectedClientId === client.id;
                return (
                  <TableRow 
                    key={client.id} 
                    onClick={() => onRowClick(client)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-950/30' 
                        : 'hover:bg-blue-50 dark:hover:bg-blue-950/20'
                    }`}
                    data-testid={`row-client-${client.id}`}
                  >
                    <TableCell className="py-2 px-3">
                      <div className="flex flex-col gap-0">
                        <span className="font-semibold text-foreground text-sm" data-testid={`text-company-${client.id}`}>
                          {client.companyName}
                        </span>
                        <span className="text-xs text-muted-foreground" data-testid={`text-contact-${client.id}`}>
                          {client.contactPerson}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <StageBadge stage={client.stage as any} />
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <StatusBadge status={client.status as any} />
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right font-semibold text-sm" data-testid={`text-value-${client.id}`}>
                      {formatValueByCountry(client.value, client.country)}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right font-semibold text-sm text-muted-foreground" data-testid={`text-value-inr-${client.id}`}>
                      {formatValueINR(client.value, client.country)}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground text-sm" data-testid={`text-last-followup-${client.id}`}>
                      {formatDate(client.lastFollowUp)}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground text-sm" data-testid={`text-responsible-${client.id}`}>
                      {client.responsiblePerson}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground text-sm" data-testid={`text-country-${client.id}`}>
                      {client.country}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground text-sm" data-testid={`text-service-${client.id}`}>
                      {client.service || '-'}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <PriorityBadge priority={client.priority as any} />
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center font-semibold text-foreground text-sm" data-testid={`text-days-pipeline-${client.id}`}>
                      {getDaysInPipeline(client.pipelineStartDate, client.createdAt)} days
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
