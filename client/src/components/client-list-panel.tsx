import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StageBadge } from "./stage-badge";
import { PriorityBadge } from "./priority-badge";
import { Search, Filter, MapPin, Plus } from "lucide-react";
import type { Client } from "@shared/schema";
import { useState, useMemo } from "react";
import { formatCompactCurrencyByCountry } from "@/lib/country-currency-data";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stageOptions, priorityOptions } from "@shared/schema";

interface ClientListPanelProps {
  clients: Client[];
  selectedClientId?: string;
  onSelectClient: (client: Client) => void;
  onAddClient: () => void;
}

export function ClientListPanel({ clients, selectedClientId, onSelectClient, onAddClient }: ClientListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilters = stageFilter !== "all" || priorityFilter !== "all";

  const filteredClients = useMemo(() => {
    let result = clients;

    if (stageFilter !== "all") {
      result = result.filter((client) => client.stage === stageFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((client) => client.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (client) =>
          client.companyName.toLowerCase().includes(query) ||
          client.contactPerson.toLowerCase().includes(query) ||
          client.stage.toLowerCase().includes(query) ||
          (client.status && client.status.toLowerCase().includes(query)) ||
          client.priority.toLowerCase().includes(query) ||
          client.country.toLowerCase().includes(query) ||
          (client.responsiblePerson && client.responsiblePerson.toLowerCase().includes(query))
      );
    }

    return result;
  }, [clients, searchQuery, stageFilter, priorityFilter]);

  const clearFilters = () => {
    setStageFilter("all");
    setPriorityFilter("all");
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <div className="p-3 border-b bg-background space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
            data-testid="input-search-clients"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground" data-testid="text-client-count">
            {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
          </div>
          <div className="flex items-center gap-2">
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant={hasActiveFilters ? "default" : "outline"} 
                  size="sm" 
                  className="gap-2"
                  data-testid="button-filter"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {(stageFilter !== "all" ? 1 : 0) + (priorityFilter !== "all" ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-3">
                  <div className="font-medium text-sm">Filters</div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Stage</label>
                    <Select value={stageFilter} onValueChange={setStageFilter}>
                      <SelectTrigger className="h-8" data-testid="select-filter-stage">
                        <SelectValue placeholder="All stages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All stages</SelectItem>
                        {stageOptions.map((stage) => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Priority</label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="h-8" data-testid="select-filter-priority">
                        <SelectValue placeholder="All priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All priorities</SelectItem>
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full" 
                      onClick={clearFilters}
                      data-testid="button-clear-filters"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button 
              size="sm" 
              onClick={onAddClient}
              className="gap-1.5"
              data-testid="button-add-client"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {searchQuery || hasActiveFilters 
                ? "No clients found matching your criteria" 
                : "No clients yet. Add your first client to get started."}
            </div>
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedClientId === client.id 
                    ? 'bg-primary/10 border border-primary' 
                    : 'hover:bg-muted/60 border border-transparent'
                }`}
                data-testid={`button-client-${client.id}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" data-testid={`text-company-${client.id}`}>
                      {client.companyName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {client.contactPerson}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-right whitespace-nowrap" data-testid={`text-value-${client.id}`}>
                    {formatCompactCurrencyByCountry(client.value, client.country)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <StageBadge stage={client.stage as any} />
                  <PriorityBadge priority={client.priority as any} />
                  {client.service && (
                    <Badge 
                      variant="outline" 
                      className="text-xs h-5 px-1.5 bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700"
                    >
                      {client.service}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{client.country}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
