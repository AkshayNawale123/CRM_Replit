import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/metric-card";
import { Navigation } from "@/components/navigation";
import { Users, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react";
import type { Client } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ClientTable } from "@/components/client-table";
import { ClientDetailsDialog } from "@/components/client-details-dialog";
import { useState, useMemo, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

type SortField = 'companyName' | 'stage' | 'status' | 'value' | 'lastFollowUp' | 'responsiblePerson' | 'country' | 'priority' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Reports() {
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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

  const totalPages = Math.ceil(totalClients / ITEMS_PER_PAGE);

  // Clamp current page when data changes
  useEffect(() => {
    if (clients.length === 0) {
      setCurrentPage(1);
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [clients.length, totalPages, currentPage]);

  const sortedClients = useMemo(() => {
    const sorted = [...clients].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null/undefined values symmetrically
      const aIsNull = aValue === null || aValue === undefined;
      const bIsNull = bValue === null || bValue === undefined;
      
      if (aIsNull && bIsNull) return 0;
      if (aIsNull) return sortOrder === 'asc' ? 1 : -1;
      if (bIsNull) return sortOrder === 'asc' ? -1 : 1;

      // Convert dates to timestamps for comparison
      if (sortField === 'lastFollowUp' || sortField === 'createdAt') {
        const aTime = new Date(aValue).getTime();
        const bTime = new Date(bValue).getTime();
        
        // Check for invalid dates
        if (isNaN(aTime) && isNaN(bTime)) return 0;
        if (isNaN(aTime)) return sortOrder === 'asc' ? 1 : -1;
        if (isNaN(bTime)) return sortOrder === 'asc' ? -1 : 1;
        
        aValue = aTime;
        bValue = bTime;
      }

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Numeric comparison
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    return sorted;
  }, [clients, sortField, sortOrder]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedClients.slice(startIndex, endIndex);
  }, [sortedClients, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

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

        <div className="space-y-3">
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
            <>
              <ClientTable 
                clients={paginatedClients} 
                onEditClient={handleViewDetails}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              
              {totalPages > 1 && (
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalClients)} of {totalClients} entries
                      </p>
                      
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              data-testid="button-pagination-previous"
                            />
                          </PaginationItem>
                          
                          {getPageNumbers().map((page, index) => (
                            <PaginationItem key={index}>
                              {page === 'ellipsis' ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  onClick={() => handlePageChange(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                  data-testid={`button-page-${page}`}
                                >
                                  {page}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              data-testid="button-pagination-next"
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
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
