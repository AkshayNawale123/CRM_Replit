import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

type Stage = 
  | "Lead"
  | "Qualified"
  | "Meeting Scheduled"
  | "Demo Completed"
  | "Proof of Concept (POC)"
  | "Proposal Sent"
  | "Verbal Commitment"
  | "Contract Review"
  | "Won"
  | "Lost";

interface StageBadgeProps {
  stage: Stage;
}

export function StageBadge({ stage }: StageBadgeProps) {
  const getStageStyles = () => {
    switch (stage) {
      case "Lead":
        return {
          dotColor: "text-gray-500",
          bgColor: "bg-gray-100 text-gray-700",
          darkBgColor: "dark:bg-gray-900 dark:text-gray-300",
        };
      case "Qualified":
        return {
          dotColor: "text-blue-500",
          bgColor: "bg-blue-100 text-blue-700",
          darkBgColor: "dark:bg-blue-950 dark:text-blue-300",
        };
      case "Meeting Scheduled":
        return {
          dotColor: "text-cyan-500",
          bgColor: "bg-cyan-100 text-cyan-700",
          darkBgColor: "dark:bg-cyan-950 dark:text-cyan-300",
        };
      case "Demo Completed":
        return {
          dotColor: "text-indigo-500",
          bgColor: "bg-indigo-100 text-indigo-700",
          darkBgColor: "dark:bg-indigo-950 dark:text-indigo-300",
        };
      case "Proof of Concept (POC)":
        return {
          dotColor: "text-violet-500",
          bgColor: "bg-violet-100 text-violet-700",
          darkBgColor: "dark:bg-violet-950 dark:text-violet-300",
        };
      case "Proposal Sent":
        return {
          dotColor: "text-purple-500",
          bgColor: "bg-purple-100 text-purple-700",
          darkBgColor: "dark:bg-purple-950 dark:text-purple-300",
        };
      case "Verbal Commitment":
        return {
          dotColor: "text-teal-500",
          bgColor: "bg-teal-100 text-teal-700",
          darkBgColor: "dark:bg-teal-950 dark:text-teal-300",
        };
      case "Contract Review":
        return {
          dotColor: "text-emerald-500",
          bgColor: "bg-emerald-100 text-emerald-700",
          darkBgColor: "dark:bg-emerald-950 dark:text-emerald-300",
        };
      case "Won":
        return {
          dotColor: "text-green-500",
          bgColor: "bg-green-100 text-green-700",
          darkBgColor: "dark:bg-green-950 dark:text-green-300",
        };
      case "Lost":
        return {
          dotColor: "text-red-500",
          bgColor: "bg-red-100 text-red-700",
          darkBgColor: "dark:bg-red-950 dark:text-red-300",
        };
      default:
        return {
          dotColor: "text-gray-500",
          bgColor: "bg-gray-100 text-gray-700",
          darkBgColor: "dark:bg-gray-900 dark:text-gray-300",
        };
    }
  };

  const styles = getStageStyles();

  return (
    <Badge 
      variant="secondary" 
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs ${styles.bgColor} ${styles.darkBgColor} font-medium`}
      data-testid={`badge-stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Circle className={`h-1.5 w-1.5 fill-current ${styles.dotColor}`} />
      <span>{stage}</span>
    </Badge>
  );
}
