import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { Clock, Check, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { StageHistory } from "@shared/schema";

interface StageTimelineProps {
  clientId: string;
  currentStage: string;
  currentStageEnteredAt?: Date | string;
}

const stageExpectedDays: Record<string, { min: number; max: number; display: string }> = {
  "Lead": { min: 1, max: 2, display: "24-48h" },
  "Qualified": { min: 2, max: 3, display: "2-3d" },
  "Meeting Scheduled": { min: 1, max: 5, display: "1-5d" },
  "Demo Completed": { min: 3, max: 5, display: "3-5d" },
  "Proof of Concept (POC)": { min: 7, max: 21, display: "1-3w" },
  "Proposal Sent": { min: 5, max: 7, display: "5-7d" },
  "Verbal Commitment": { min: 3, max: 5, display: "3-5d" },
  "Contract Review": { min: 5, max: 10, display: "5-10d" },
  "Won": { min: 0, max: 0, display: "N/A" },
  "Lost": { min: 0, max: 0, display: "N/A" },
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDuration(seconds: number | null, enteredAt?: Date | string, exitedAt?: Date | string | null): string {
  const startDate = toDate(enteredAt);
  const endDate = toDate(exitedAt);
  
  if (seconds !== null && seconds !== undefined && seconds > 0) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  }
  
  if (startDate && endDate) {
    const diffHours = differenceInHours(endDate, startDate);
    const days = Math.floor(diffHours / 24);
    const hours = diffHours % 24;
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  }
  
  if (startDate && !endDate) {
    const now = new Date();
    const diffHours = differenceInHours(now, startDate);
    const days = Math.floor(diffHours / 24);
    const hours = diffHours % 24;
    if (days > 0) {
      return `${days}d ${hours}h (ongoing)`;
    }
    return `${hours}h (ongoing)`;
  }
  
  return "N/A";
}

function getDurationDays(seconds: number | null, enteredAt?: Date | string, exitedAt?: Date | string | null): number {
  const startDate = toDate(enteredAt);
  const endDate = toDate(exitedAt);
  
  if (seconds !== null && seconds !== undefined && seconds > 0) {
    return seconds / 86400;
  }
  
  if (startDate && endDate) {
    return differenceInDays(endDate, startDate);
  }
  
  if (startDate && !endDate) {
    return differenceInDays(new Date(), startDate);
  }
  
  return 0;
}

function getDurationStatus(stage: string, durationDays: number): "on-track" | "warning" | "overdue" {
  const expected = stageExpectedDays[stage];
  if (!expected || expected.max === 0) return "on-track";
  
  if (durationDays <= expected.max) {
    return "on-track";
  } else if (durationDays <= expected.max * 1.5) {
    return "warning";
  }
  return "overdue";
}

export function StageTimeline({ clientId, currentStage, currentStageEnteredAt }: StageTimelineProps) {
  const { data: stageHistory, isLoading, error } = useQuery<StageHistory[]>({
    queryKey: ["/api/clients", clientId, "stage-history"],
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <Card data-testid="stage-timeline-loading">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Stage Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !stageHistory) {
    return (
      <Card data-testid="stage-timeline-error">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Stage Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load stage history.</p>
        </CardContent>
      </Card>
    );
  }

  const sortedHistory = [...stageHistory].sort((a, b) => 
    new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime()
  );

  const currentStageInfo = sortedHistory.find(h => h.stage === currentStage && !h.exitedAt);
  const currentStageDurationDays = currentStageInfo 
    ? getDurationDays(null, currentStageInfo.enteredAt, null)
    : currentStageEnteredAt
      ? getDurationDays(null, currentStageEnteredAt, null)
      : 0;
  const currentStageStatus = getDurationStatus(currentStage, currentStageDurationDays);

  return (
    <Card data-testid="stage-timeline">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Stage Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentStageStatus !== "on-track" && stageExpectedDays[currentStage] && (
          <div 
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg border",
              currentStageStatus === "overdue" 
                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
                : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900"
            )}
            data-testid="overdue-alert"
          >
            <AlertTriangle className={cn(
              "h-4 w-4 flex-shrink-0",
              currentStageStatus === "overdue" ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"
            )} />
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium",
                currentStageStatus === "overdue" ? "text-red-700 dark:text-red-300" : "text-yellow-700 dark:text-yellow-300"
              )}>
                {currentStageStatus === "overdue" ? "Stage Overdue" : "Approaching Deadline"}
              </p>
              <p className={cn(
                "text-xs",
                currentStageStatus === "overdue" ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"
              )}>
                Client has been in "{currentStage}" for {Math.round(currentStageDurationDays)} days. 
                Expected: {stageExpectedDays[currentStage]?.display}
              </p>
            </div>
          </div>
        )}

        {sortedHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No stage history recorded yet.
          </p>
        ) : (
          <div className="relative pl-4 space-y-4" data-testid="timeline-list">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
            
            {sortedHistory.map((stage, index) => {
              const isCurrentStage = stage.stage === currentStage && !stage.exitedAt;
              const durationDays = getDurationDays(stage.durationSeconds, stage.enteredAt, stage.exitedAt);
              const status = getDurationStatus(stage.stage, durationDays);
              const expected = stageExpectedDays[stage.stage];
              
              return (
                <div 
                  key={stage.id}
                  className="relative flex gap-3"
                  data-testid={`timeline-item-${index}`}
                >
                  <div className={cn(
                    "absolute -left-4 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center",
                    isCurrentStage && "border-primary bg-primary",
                    !isCurrentStage && stage.exitedAt && "border-green-500 bg-green-500",
                    !isCurrentStage && !stage.exitedAt && "border-muted-foreground"
                  )}>
                    {!isCurrentStage && stage.exitedAt && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                    {isCurrentStage && (
                      <TrendingUp className="w-2.5 h-2.5 text-primary-foreground" />
                    )}
                  </div>
                  
                  <div className={cn(
                    "flex-1 bg-muted/30 rounded-lg p-3 border",
                    isCurrentStage && "border-primary/50 bg-primary/5",
                    status === "overdue" && isCurrentStage && "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
                    status === "warning" && isCurrentStage && "border-yellow-300 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20"
                  )}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{stage.stage}</span>
                        {isCurrentStage && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            Current
                          </Badge>
                        )}
                      </div>
                      
                      {isCurrentStage && status !== "on-track" && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            status === "overdue" 
                              ? "border-red-500 text-red-600 dark:text-red-400" 
                              : "border-yellow-500 text-yellow-600 dark:text-yellow-400"
                          )}
                          data-testid={`status-badge-${index}`}
                        >
                          {status === "overdue" ? "Overdue" : "Warning"}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Entered:</span>
                        <div className="font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(stage.enteredAt), "MMM d, yyyy")}
                        </div>
                      </div>
                      
                      {stage.exitedAt ? (
                        <div>
                          <span className="text-muted-foreground">Exited:</span>
                          <div className="font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(stage.exitedAt), "MMM d, yyyy")}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div className="font-medium text-primary">In Progress</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-muted-foreground">Actual: </span>
                            <span className={cn(
                              "font-bold",
                              isCurrentStage && status === "overdue" && "text-red-600 dark:text-red-400",
                              isCurrentStage && status === "warning" && "text-yellow-600 dark:text-yellow-400",
                              isCurrentStage && status === "on-track" && "text-green-600 dark:text-green-400",
                              !isCurrentStage && "text-foreground"
                            )} data-testid={`actual-duration-${index}`}>
                              {formatDuration(stage.durationSeconds, stage.enteredAt, stage.exitedAt)}
                            </span>
                          </div>
                          
                          <span className="text-muted-foreground">|</span>
                          
                          <div>
                            <span className="text-muted-foreground">Expected: </span>
                            <span className="font-medium">{expected?.display || "N/A"}</span>
                          </div>
                        </div>
                        
                        {expected && expected.max > 0 && (
                          <DurationComparisonBar 
                            actual={durationDays} 
                            max={expected.max}
                            status={isCurrentStage ? status : "on-track"}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DurationComparisonBar({ 
  actual, 
  max, 
  status 
}: { 
  actual: number; 
  max: number; 
  status: "on-track" | "warning" | "overdue" 
}) {
  const percentage = Math.min((actual / max) * 100, 150);
  
  return (
    <div className="flex items-center gap-1.5" data-testid="duration-bar">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            status === "on-track" && "bg-green-500",
            status === "warning" && "bg-yellow-500",
            status === "overdue" && "bg-red-500"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={cn(
        "text-[10px] font-medium",
        status === "on-track" && "text-green-600 dark:text-green-400",
        status === "warning" && "text-yellow-600 dark:text-yellow-400",
        status === "overdue" && "text-red-600 dark:text-red-400"
      )}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

export function OverdueBadge({ 
  stage, 
  enteredAt,
  pipelineStartDate 
}: { 
  stage: string; 
  enteredAt?: Date | string;
  pipelineStartDate?: Date | string;
}) {
  if (stage === "Won" || stage === "Lost") {
    return null;
  }
  
  const expected = stageExpectedDays[stage];
  if (!expected || expected.max === 0) {
    return null;
  }
  
  const startDate = toDate(pipelineStartDate) || toDate(enteredAt);
      
  if (!startDate) {
    return null;
  }
  
  const durationDays = differenceInDays(new Date(), startDate);
  const status = getDurationStatus(stage, durationDays);
  
  if (status === "on-track") {
    return null;
  }
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[10px] px-1.5 py-0 gap-1",
        status === "overdue" 
          ? "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30" 
          : "border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30"
      )}
      data-testid="overdue-badge"
    >
      <AlertTriangle className="w-3 h-3" />
      {status === "overdue" ? "Overdue" : "Warning"}
    </Badge>
  );
}

export function getStageStatus(stage: string, enteredAt?: Date | string): "on-track" | "warning" | "overdue" | null {
  if (!enteredAt || stage === "Won" || stage === "Lost") {
    return null;
  }
  
  const startDate = toDate(enteredAt);
  if (!startDate) {
    return null;
  }
  
  const durationDays = differenceInDays(new Date(), startDate);
  return getDurationStatus(stage, durationDays);
}
