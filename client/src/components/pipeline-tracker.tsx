import { Check, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineTrackerProps {
  currentStage: string;
  currentStatus: string | null;
  compact?: boolean;
}

const stages = [
  { name: "Lead", short: "L", wait: "24-48h" },
  { name: "Qualified", short: "Q", wait: "2-3d" },
  { name: "Meeting Scheduled", short: "M", wait: "1-5d" },
  { name: "Demo Completed", short: "D", wait: "3-5d" },
  { name: "Proof of Concept (POC)", short: "P", wait: "1-3w" },
  { name: "Proposal Sent", short: "PR", wait: "5-7d" },
  { name: "Verbal Commitment", short: "V", wait: "3-5d" },
  { name: "Contract Review", short: "C", wait: "5-10d" },
  { name: "Won", short: "W", wait: "-" },
  { name: "Lost", short: "X", wait: "-" }
];

const statusIndicators: Record<string, { color: string; label: string }> = {
  "In Negotiation": { color: "bg-purple-500", label: "Negotiating" },
  "Proposal Rejected": { color: "bg-red-500", label: "Rejected" },
  "On Hold": { color: "bg-orange-500", label: "On Hold" },
  "Pending Review": { color: "bg-yellow-500", label: "Pending" },
  "Awaiting Response": { color: "bg-blue-500", label: "Awaiting" },
  "Under Evaluation": { color: "bg-indigo-500", label: "Evaluating" },
  "Budget Approval Pending": { color: "bg-green-500", label: "Budget Pending" }
};

export function PipelineTracker({ currentStage, currentStatus, compact = false }: PipelineTrackerProps) {
  const getStageIndex = (stageName: string) => {
    return stages.findIndex(s => s.name === stageName);
  };

  const getStageStatus = (index: number, currentIndex: number, stageName: string) => {
    if (stageName === "Won" || stageName === "Lost") {
      return currentIndex === index ? 'current' : 'pending';
    }
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const currentIndex = getStageIndex(currentStage);
  const mainStages = stages.slice(0, -2);
  const outcomeStages = stages.slice(-2);

  return (
    <div className="w-full" data-testid="pipeline-tracker">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {mainStages.map((stage, index) => {
              const status = getStageStatus(index, currentIndex, currentStage);
              const isActive = index === currentIndex && currentStage !== "Won" && currentStage !== "Lost";
              
              return (
                <div key={stage.name} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all relative",
                        status === 'completed' && "bg-green-500 text-white shadow-sm",
                        status === 'current' && "bg-blue-500 text-white shadow-md ring-2 ring-blue-300 dark:ring-blue-600",
                        status === 'pending' && "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      )}
                      title={stage.name}
                      data-testid={`stage-circle-${stage.short}`}
                    >
                      {status === 'completed' ? <Check className="w-3.5 h-3.5" /> : stage.short}
                      
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full border border-white dark:border-gray-900" />
                      )}
                    </div>
                    
                    {!compact && (
                      <span className={cn(
                        "text-[9px] mt-0.5 font-medium text-center max-w-[50px] leading-tight",
                        status === 'current' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                      )}>
                        {stage.short}
                      </span>
                    )}
                  </div>
                  
                  {index < mainStages.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-0.5 rounded",
                      index < currentIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
            {outcomeStages.map((stage) => {
              const isWon = stage.name === "Won" && currentStage === "Won";
              const isLost = stage.name === "Lost" && currentStage === "Lost";
              const isActive = isWon || isLost;
              
              return (
                <div key={stage.name} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                      isActive && stage.name === "Won" && "bg-green-500 text-white shadow-md ring-2 ring-green-300 dark:ring-green-600",
                      isActive && stage.name === "Lost" && "bg-red-500 text-white shadow-md ring-2 ring-red-300 dark:ring-red-600",
                      !isActive && "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    )}
                    title={stage.name}
                    data-testid={`stage-circle-${stage.short}`}
                  >
                    {stage.name === "Won" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </div>
                  <span className={cn(
                    "text-[10px] mt-0.5 font-medium",
                    isActive && stage.name === "Won" && "text-green-700 dark:text-green-400",
                    isActive && stage.name === "Lost" && "text-red-700 dark:text-red-400",
                    !isActive && "text-gray-500 dark:text-gray-400"
                  )}>
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:hidden">
          <div className="flex flex-wrap gap-1 justify-center">
            {mainStages.map((stage, index) => {
              const status = getStageStatus(index, currentIndex, currentStage);
              const isActive = index === currentIndex && currentStage !== "Won" && currentStage !== "Lost";
              
              return (
                <div key={stage.name} className="flex items-center">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] transition-all relative",
                      status === 'completed' && "bg-green-500 text-white",
                      status === 'current' && "bg-blue-500 text-white ring-2 ring-blue-300",
                      status === 'pending' && "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    )}
                    title={stage.name}
                  >
                    {status === 'completed' ? <Check className="w-3 h-3" /> : stage.short}
                    {isActive && (
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-orange-400 rounded-full border border-white dark:border-gray-900" />
                    )}
                  </div>
                  {index < mainStages.length - 1 && (
                    <div className={cn(
                      "w-1.5 h-0.5 mx-0.5",
                      index < currentIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-3 mt-2 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
            {outcomeStages.map((stage) => {
              const isWon = stage.name === "Won" && currentStage === "Won";
              const isLost = stage.name === "Lost" && currentStage === "Lost";
              const isActive = isWon || isLost;
              
              return (
                <div key={stage.name} className="flex items-center gap-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                      isActive && stage.name === "Won" && "bg-green-500 text-white",
                      isActive && stage.name === "Lost" && "bg-red-500 text-white",
                      !isActive && "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {stage.name === "Won" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive && stage.name === "Won" && "text-green-700 dark:text-green-400",
                    isActive && stage.name === "Lost" && "text-red-700 dark:text-red-400",
                    !isActive && "text-gray-500 dark:text-gray-400"
                  )}>
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {currentStatus && (
          <div className="mt-2 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Status:</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium text-white",
                statusIndicators[currentStatus]?.color || 'bg-gray-400'
              )} data-testid="pipeline-status-badge">
                {statusIndicators[currentStatus]?.label || currentStatus}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
