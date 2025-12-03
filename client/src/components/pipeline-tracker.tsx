import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PipelineTrackerProps {
  currentStage: string;
  currentStatus: string | null;
  compact?: boolean;
}

const stages = [
  { name: "Lead", short: "Lead" },
  { name: "Qualified", short: "Q" },
  { name: "Meeting Scheduled", short: "MS" },
  { name: "Demo Completed", short: "Demo" },
  { name: "POC", short: "POC" },
  { name: "Proposal Sent", short: "PR" },
  { name: "Verbal Commitment", short: "V" },
  { name: "Contract Review", short: "R" },
];

const statusColors: Record<string, string> = {
  "None": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  "In Negotiation": "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  "Proposal Rejected": "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  "On Hold": "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  "Pending Review": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  "Awaiting Response": "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  "Under Evaluation": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  "Budget Approval Pending": "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

export function PipelineTracker({
  currentStage,
  currentStatus,
  compact = false,
}: PipelineTrackerProps) {
  const getStageIndex = (stageName: string): number => {
    return stages.findIndex((s) => s.name === stageName);
  };

  const currentIndex = getStageIndex(currentStage);
  const isWon = currentStage === "Won";
  const isLost = currentStage === "Lost";

  const circleSize = compact ? "w-8 h-8" : "w-10 h-10";
  const fontSize = compact ? "text-[10px]" : "text-xs";
  const iconSize = compact ? "w-4 h-4" : "w-5 h-5";
  const labelSize = compact ? "text-[9px]" : "text-[11px]";

  return (
    <div
      className="bg-card rounded-lg border border-border p-4"
      data-testid="pipeline-tracker"
    >
      {/* Stages Row - Horizontal scroll on small screens */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start min-w-max">
          {stages.map((stage, index) => {
            const isCompleted = isWon || (index < currentIndex && !isLost);
            const isCurrent = index === currentIndex && !isWon && !isLost;

            return (
              <div key={stage.name} className="flex items-center">
                {/* Stage Circle + Label Column */}
                <div className="flex flex-col items-center min-w-[48px]">
                  {/* Circle */}
                  <div
                    className={`
                      ${circleSize} rounded-full flex items-center justify-center font-bold ${fontSize} relative
                      transition-all duration-200
                      ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                            ? "bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-400"
                            : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }
                    `}
                    data-testid={`stage-circle-${stage.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {isCompleted ? (
                      <Check className={iconSize} />
                    ) : (
                      <span>{stage.short}</span>
                    )}
                    {/* Orange dot for current stage */}
                    {isCurrent && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </div>

                  {/* Stage Label - ALWAYS visible, no hover needed */}
                  <span
                    className={`mt-1.5 ${labelSize} font-medium text-center ${
                      isCurrent
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stage.short}
                  </span>
                </div>

                {/* Connector Line between stages */}
                {index < stages.length - 1 && (
                  <div
                    className={`w-6 h-0.5 mx-1 self-start mt-[18px] ${
                      isCompleted && (index + 1 < currentIndex || isWon)
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Won/Lost Outcomes Row */}
      <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-border">
        {/* Won */}
        <div className="flex flex-col items-center">
          <div
            className={`
              ${circleSize} rounded-full flex items-center justify-center transition-all
              ${
                isWon
                  ? "bg-green-500 text-white ring-2 ring-green-300 dark:ring-green-400"
                  : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
              }
            `}
            data-testid="stage-circle-won"
          >
            <Check className={iconSize} />
          </div>
          <span
            className={`mt-1.5 ${labelSize} font-medium ${
              isWon
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            }`}
          >
            Won
          </span>
        </div>

        {/* Lost */}
        <div className="flex flex-col items-center">
          <div
            className={`
              ${circleSize} rounded-full flex items-center justify-center transition-all
              ${
                isLost
                  ? "bg-red-500 text-white ring-2 ring-red-300 dark:ring-red-400"
                  : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
              }
            `}
            data-testid="stage-circle-lost"
          >
            <X className={iconSize} />
          </div>
          <span
            className={`mt-1.5 ${labelSize} font-medium ${
              isLost
                ? "text-red-600 dark:text-red-400"
                : "text-muted-foreground"
            }`}
          >
            Lost
          </span>
        </div>
      </div>

      {/* Status Badge - Always visible when set */}
      {currentStatus && currentStatus !== "None" && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Badge
              variant="secondary"
              className={statusColors[currentStatus] || statusColors["None"]}
              data-testid="pipeline-status-badge"
            >
              {currentStatus}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
