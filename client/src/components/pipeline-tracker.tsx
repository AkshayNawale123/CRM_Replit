import { useState, useMemo } from 'react';
import { Check, X, Clock, TrendingUp, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { Client } from '@shared/schema';

interface PipelineTrackerProps {
  clients?: Client[];
  selectedClient?: Client | null;
  onSelectClient?: (client: Client) => void;
  currentStage?: string;
  currentStatus?: string | null;
  showClientSelector?: boolean;
  defaultViewMode?: 'compact' | 'detailed';
}

const stages = [
  { name: "Lead", short: "Lead", wait: "24-48h", fullName: "Lead" },
  { name: "Qualified", short: "Qualified", wait: "2-3d", fullName: "Qualified" },
  { name: "Meeting Scheduled", short: "Meeting", wait: "1-5d", fullName: "Meeting Scheduled" },
  { name: "Demo Completed", short: "Demo", wait: "3-5d", fullName: "Demo Completed" },
  { name: "Proof of Concept (POC)", short: "POC", wait: "1-3w", fullName: "Proof of Concept" },
  { name: "Proposal Sent", short: "Proposal", wait: "5-7d", fullName: "Proposal Sent" },
  { name: "Verbal Commitment", short: "Verbal", wait: "3-5d", fullName: "Verbal Commitment" },
  { name: "Contract Review", short: "Contract", wait: "5-10d", fullName: "Contract Review" }
];

const statusIndicators: Record<string, { bgClass: string; textClass: string }> = {
  "None": { bgClass: "bg-gray-400 dark:bg-gray-500", textClass: "text-gray-700 dark:text-gray-300" },
  "In Negotiation": { bgClass: "bg-purple-500 dark:bg-purple-400", textClass: "text-purple-700 dark:text-purple-300" },
  "Proposal Rejected": { bgClass: "bg-red-500 dark:bg-red-400", textClass: "text-red-700 dark:text-red-300" },
  "On Hold": { bgClass: "bg-orange-500 dark:bg-orange-400", textClass: "text-orange-700 dark:text-orange-300" },
  "Pending Review": { bgClass: "bg-yellow-500 dark:bg-yellow-400", textClass: "text-yellow-700 dark:text-yellow-300" },
  "Awaiting Response": { bgClass: "bg-blue-500 dark:bg-blue-400", textClass: "text-blue-700 dark:text-blue-300" },
  "Under Evaluation": { bgClass: "bg-indigo-500 dark:bg-indigo-400", textClass: "text-indigo-700 dark:text-indigo-300" },
  "Budget Approval Pending": { bgClass: "bg-green-500 dark:bg-green-400", textClass: "text-green-700 dark:text-green-300" }
};

export function PipelineTracker({
  clients = [],
  selectedClient,
  onSelectClient,
  currentStage: propCurrentStage,
  currentStatus: propCurrentStatus,
  showClientSelector = false,
  defaultViewMode = 'compact'
}: PipelineTrackerProps) {
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>(defaultViewMode);
  const [internalSelectedClient, setInternalSelectedClient] = useState<Client | null>(null);
  const [clientSelectorOpen, setClientSelectorOpen] = useState(false);

  const activeClient = selectedClient ?? internalSelectedClient;
  const currentStage = propCurrentStage ?? activeClient?.stage ?? 'Lead';
  const currentStatus = propCurrentStatus ?? activeClient?.status ?? null;

  const handleClientSelect = (client: Client) => {
    if (onSelectClient) {
      onSelectClient(client);
    } else {
      setInternalSelectedClient(client);
    }
  };

  const getStageIndex = (stageName: string): number => {
    if (stageName === "Won") return stages.length;
    if (stageName === "Lost") return -1;
    return stages.findIndex(s => s.name === stageName);
  };

  const isWon = currentStage === "Won";
  const isLost = currentStage === "Lost";
  const isTerminal = isWon || isLost;
  const currentIndex = getStageIndex(currentStage);
  const progressPercentage = isWon ? 100 : isLost ? 0 : Math.round(((currentIndex + 1) / stages.length) * 100);

  const CompactView = () => (
    <Card className="border-2" data-testid="compact-view-card">
      <CardContent className="p-4 md:p-6">
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-sm font-semibold text-muted-foreground" data-testid="text-progress-label">Progress</span>
            <span className={cn(
              "text-sm font-semibold",
              isWon ? "text-green-600 dark:text-green-400" :
              isLost ? "text-red-600 dark:text-red-400" :
              "text-primary"
            )} data-testid="text-progress-percentage">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2" data-testid="progress-bar-container">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                isWon ? "bg-green-500" : isLost ? "bg-red-500" : "bg-primary"
              )}
              style={{ width: `${progressPercentage}%` }}
              data-testid="progress-bar"
            />
          </div>
        </div>

        <ScrollArea className="w-full pb-4">
          <div className="flex gap-2 md:gap-3 min-w-max px-1">
            {stages.map((stage, index) => {
              const isCompleted = isWon ? true : isLost ? false : index < currentIndex;
              const isCurrent = !isTerminal && index === currentIndex;

              return (
                <div key={stage.name} className="flex items-start" data-testid={`stage-item-${index}`}>
                  <div className="flex flex-col items-center min-w-[70px] md:min-w-[100px]">
                    <div className={cn(
                      "relative w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                      isCompleted && "bg-green-500 text-white shadow-lg",
                      isCurrent && "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/30",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )} data-testid={`stage-circle-${stage.short}`}>
                      {isCompleted ? <Check className="w-5 h-5 md:w-7 md:h-7" /> : (index + 1)}
                    </div>
                    
                    <div className={cn(
                      "text-center font-semibold text-[10px] md:text-xs mt-1 md:mt-2 mb-1",
                      isCurrent ? "text-primary" : "text-foreground"
                    )} data-testid={`stage-label-${stage.short}`}>
                      {stage.short}
                    </div>
                    
                    <div className="flex items-center gap-1 text-[9px] md:text-[10px] text-muted-foreground bg-muted px-1.5 md:px-2 py-0.5 rounded-full" data-testid={`stage-wait-${stage.short}`}>
                      <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      <span>{stage.wait}</span>
                    </div>
                  </div>
                  
                  {index < stages.length - 1 && (
                    <div className={cn(
                      "w-4 md:w-8 h-0.5 mt-6 md:mt-8 mx-0.5 md:mx-1",
                      isWon ? "bg-green-500" : (isLost ? "bg-muted" : (index < currentIndex ? "bg-green-500" : "bg-muted"))
                    )} data-testid={`stage-connector-${index}`} />
                  )}
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="flex justify-center gap-4 md:gap-6 mt-4 md:mt-6 pt-4 md:pt-6 border-t-2 border-border">
          <div className={cn(
            "flex flex-col items-center p-3 md:p-4 rounded-lg transition-all",
            isWon ? "bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500" : "bg-muted/50"
          )} data-testid="outcome-won">
            <div className={cn(
              "w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-2",
              isWon ? "bg-green-500 text-white shadow-lg" : "bg-muted text-muted-foreground"
            )} data-testid="outcome-won-circle">
              <Check className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <span className={cn(
              "font-bold text-xs md:text-sm",
              isWon ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
            )} data-testid="outcome-won-label">
              Won
            </span>
          </div>

          <div className={cn(
            "flex flex-col items-center p-3 md:p-4 rounded-lg transition-all",
            isLost ? "bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500" : "bg-muted/50"
          )} data-testid="outcome-lost">
            <div className={cn(
              "w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-2",
              isLost ? "bg-red-500 text-white shadow-lg" : "bg-muted text-muted-foreground"
            )} data-testid="outcome-lost-circle">
              <X className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <span className={cn(
              "font-bold text-xs md:text-sm",
              isLost ? "text-red-700 dark:text-red-400" : "text-muted-foreground"
            )} data-testid="outcome-lost-label">
              Lost
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const DetailedView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3" data-testid="detailed-view-grid">
      {stages.map((stage, index) => {
        const isCompleted = isWon ? true : isLost ? false : index < currentIndex;
        const isCurrent = !isTerminal && index === currentIndex;

        return (
          <Card 
            key={stage.name}
            className={cn(
              "transition-all border-2",
              isCompleted && "bg-green-50 dark:bg-green-900/20 border-green-500",
              isCurrent && "bg-primary/10 border-primary ring-2 ring-primary/30",
              !isCompleted && !isCurrent && "bg-muted/30 border-border"
            )}
            data-testid={`stage-card-${index}`}
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-2 gap-1">
                <span className={cn(
                  "text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )} data-testid={`stage-number-${index}`}>
                  #{index + 1}
                </span>
                
                {isCompleted && <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" data-testid={`stage-check-${index}`} />}
                {isCurrent && <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse" data-testid={`stage-current-${index}`} />}
              </div>

              <h4 className={cn(
                "font-bold text-xs md:text-sm mb-2",
                isCurrent ? "text-primary" : "text-foreground"
              )} data-testid={`stage-name-${index}`}>
                {stage.fullName}
              </h4>

              <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs" data-testid={`stage-wait-detail-${index}`}>
                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Wait: <span className="font-semibold">{stage.wait}</span></span>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card className={cn(
        "transition-all border-2",
        isWon ? "bg-green-50 dark:bg-green-900/20 border-green-500 ring-2 ring-green-300 dark:ring-green-600" : "bg-muted/30 border-border"
      )} data-testid="outcome-card-won">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-2 gap-1">
            <span className="text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-green-500 text-white" data-testid="outcome-card-won-badge">
              <Check className="w-3 h-3 inline" />
            </span>
            {isWon && <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" data-testid="outcome-card-won-check" />}
          </div>
          <h4 className="font-bold text-xs md:text-sm text-foreground" data-testid="outcome-card-won-title">Won</h4>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1" data-testid="outcome-card-won-subtitle">Deal Closed</p>
        </CardContent>
      </Card>

      <Card className={cn(
        "transition-all border-2",
        isLost ? "bg-red-50 dark:bg-red-900/20 border-red-500 ring-2 ring-red-300 dark:ring-red-600" : "bg-muted/30 border-border"
      )} data-testid="outcome-card-lost">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-2 gap-1">
            <span className="text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-red-500 text-white" data-testid="outcome-card-lost-badge">
              <X className="w-3 h-3 inline" />
            </span>
            {isLost && <X className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" data-testid="outcome-card-lost-check" />}
          </div>
          <h4 className="font-bold text-xs md:text-sm text-foreground" data-testid="outcome-card-lost-title">Lost</h4>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1" data-testid="outcome-card-lost-subtitle">Deal Lost</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full space-y-4" data-testid="pipeline-tracker">
      {showClientSelector && clients.length > 0 && (
        <Card data-testid="client-selector-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold" data-testid="client-selector-title">Select Client</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Popover open={clientSelectorOpen} onOpenChange={setClientSelectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientSelectorOpen}
                  className="w-full justify-between"
                  data-testid="button-client-selector-dropdown"
                >
                  {activeClient ? (
                    <span className="truncate">{activeClient.companyName}</span>
                  ) : (
                    <span className="text-muted-foreground">Search and select a client...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search clients..." data-testid="input-client-search" />
                  <CommandList>
                    <CommandEmpty>No client found.</CommandEmpty>
                    <CommandGroup>
                      {clients.map(client => (
                        <CommandItem
                          key={client.id}
                          value={client.companyName}
                          onSelect={() => {
                            handleClientSelect(client);
                            setClientSelectorOpen(false);
                          }}
                          data-testid={`option-client-${client.id}`}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              activeClient?.id === client.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{client.companyName}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {activeClient && (
              <div className="mt-4 p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20" data-testid="client-info-display">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-muted-foreground" data-testid="label-current-stage">Current Stage:</span>
                    <Badge variant="default" className="text-xs" data-testid="badge-current-stage">
                      {activeClient.stage}
                    </Badge>
                  </div>
                  {activeClient.status && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-muted-foreground" data-testid="label-current-status">Status:</span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-semibold text-white",
                        statusIndicators[activeClient.status]?.bgClass || "bg-muted"
                      )} data-testid="badge-current-status">
                        {activeClient.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap" data-testid="view-mode-toggle-group">
        <Button
          variant={viewMode === 'compact' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('compact')}
          data-testid="button-view-compact"
        >
          Compact View
        </Button>
        <Button
          variant={viewMode === 'detailed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('detailed')}
          data-testid="button-view-detailed"
        >
          Detailed Cards
        </Button>
      </div>

      {viewMode === 'compact' ? <CompactView /> : <DetailedView />}

      {currentStatus && (
        <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg" data-testid="status-display">
          <span className="text-xs text-muted-foreground" data-testid="label-status">Current Status:</span>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold text-white",
            statusIndicators[currentStatus]?.bgClass || "bg-muted"
          )} data-testid="pipeline-status-badge">
            {currentStatus}
          </span>
        </div>
      )}
    </div>
  );
}

export function SimplePipelineTracker({ currentStage, currentStatus }: { currentStage: string; currentStatus: string | null }) {
  const getStageIndex = (stageName: string): number => {
    if (stageName === "Won") return stages.length;
    if (stageName === "Lost") return -1;
    return stages.findIndex(s => s.name === stageName);
  };

  const isWon = currentStage === "Won";
  const isLost = currentStage === "Lost";
  const isTerminal = isWon || isLost;
  const currentIndex = getStageIndex(currentStage);
  const mainStages = stages;

  return (
    <div className="w-full" data-testid="simple-pipeline-tracker">
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-3 border border-primary/20">
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {mainStages.map((stage, index) => {
              const isCompleted = isWon ? true : isLost ? false : index < currentIndex;
              const isCurrent = !isTerminal && index === currentIndex;
              
              return (
                <div key={stage.name} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all relative",
                        isCompleted && "bg-green-500 text-white shadow-sm",
                        isCurrent && "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50",
                        !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                      )}
                      title={stage.name}
                      data-testid={`stage-circle-${stage.short}`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : stage.short.charAt(0)}
                      
                      {isCurrent && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full border border-background" />
                      )}
                    </div>
                    
                    <span className={cn(
                      "text-[9px] mt-0.5 font-medium text-center max-w-[50px] leading-tight",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>
                      {stage.short}
                    </span>
                  </div>
                  
                  {index < mainStages.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-0.5 rounded",
                      isWon ? "bg-green-500" : (isLost ? "bg-muted" : (index < currentIndex ? "bg-green-500" : "bg-muted"))
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-border/50">
            <div className="flex flex-col items-center" data-testid="simple-outcome-won">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                  isWon && "bg-green-500 text-white shadow-md ring-2 ring-green-300",
                  !isWon && "bg-muted text-muted-foreground"
                )}
                title="Won"
                data-testid="simple-outcome-won-circle"
              >
                <Check className="w-4 h-4" />
              </div>
              <span className={cn(
                "text-[10px] mt-0.5 font-medium",
                isWon ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )} data-testid="simple-outcome-won-label">
                Won
              </span>
            </div>

            <div className="flex flex-col items-center" data-testid="simple-outcome-lost">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                  isLost && "bg-red-500 text-white shadow-md ring-2 ring-red-300",
                  !isLost && "bg-muted text-muted-foreground"
                )}
                title="Lost"
                data-testid="simple-outcome-lost-circle"
              >
                <X className="w-4 h-4" />
              </div>
              <span className={cn(
                "text-[10px] mt-0.5 font-medium",
                isLost ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
              )} data-testid="simple-outcome-lost-label">
                Lost
              </span>
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <div className="flex flex-wrap gap-1 justify-center">
            {mainStages.map((stage, index) => {
              const isCompleted = isWon ? true : isLost ? false : index < currentIndex;
              const isCurrent = !isTerminal && index === currentIndex;
              
              return (
                <div key={stage.name} className="flex items-center">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] transition-all relative",
                      isCompleted && "bg-green-500 text-white",
                      isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/50",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                    title={stage.name}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : (index + 1)}
                    {isCurrent && (
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-orange-400 rounded-full border border-background" />
                    )}
                  </div>
                  {index < mainStages.length - 1 && (
                    <div className={cn(
                      "w-1.5 h-0.5 mx-0.5",
                      isWon ? "bg-green-500" : (isLost ? "bg-muted" : (index < currentIndex ? "bg-green-500" : "bg-muted"))
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-3 mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1" data-testid="simple-mobile-outcome-won">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  isWon && "bg-green-500 text-white",
                  !isWon && "bg-muted text-muted-foreground"
                )}
              >
                <Check className="w-3 h-3" />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isWon ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}>
                Won
              </span>
            </div>
            <div className="flex items-center gap-1" data-testid="simple-mobile-outcome-lost">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  isLost && "bg-red-500 text-white",
                  !isLost && "bg-muted text-muted-foreground"
                )}
              >
                <X className="w-3 h-3" />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isLost ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
              )}>
                Lost
              </span>
            </div>
          </div>
        </div>

        {currentStatus && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] text-muted-foreground">Status:</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium text-white",
                statusIndicators[currentStatus]?.bgClass || "bg-muted"
              )} data-testid="pipeline-status-badge">
                {currentStatus}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
