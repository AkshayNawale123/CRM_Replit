import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StageBadge } from "./stage-badge";
import { PriorityBadge } from "./priority-badge";
import { Search, Plus } from "lucide-react";
import type { Client } from "@shared/schema";
import { useState, useMemo } from "react";

interface ClientListPanelProps {
  clients: Client[];
  selectedClientId?: string;
  onSelectClient: (client: Client) => void;
  onAddClient: () => void;
}

export function ClientListPanel({ clients, selectedClientId, onSelectClient, onAddClient }: ClientListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.companyName.toLowerCase().includes(query) ||
        client.contactPerson.toLowerCase().includes(query) ||
        client.stage.toLowerCase().includes(query) ||
        (client.status && client.status.toLowerCase().includes(query)) ||
        client.priority.toLowerCase().includes(query) ||
        client.country.toLowerCase().includes(query) ||
        client.responsiblePerson.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <div className="p-4 border-b bg-background space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" data-testid="text-clients-header">Clients</h2>
          <Button size="sm" onClick={onAddClient} className="gap-2" data-testid="button-add-client">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-clients"
          />
        </div>
        <div className="text-sm text-muted-foreground" data-testid="text-client-count">
          {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {searchQuery ? "No clients found matching your search" : "No clients yet. Add your first client to get started."}
            </div>
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                  selectedClientId === client.id ? 'bg-muted border-2 border-primary' : 'border border-transparent'
                }`}
                data-testid={`button-client-${client.id}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{client.companyName}</div>
                    <div className="text-sm text-muted-foreground truncate">{client.contactPerson}</div>
                  </div>
                  <div className="text-sm font-semibold text-right whitespace-nowrap">
                    {formatCurrency(client.value)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StageBadge stage={client.stage as any} />
                  <PriorityBadge priority={client.priority as any} />
                  <span className="text-xs text-muted-foreground">{client.country}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
