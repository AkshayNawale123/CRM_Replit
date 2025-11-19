import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

type Stage = "Lead" | "Qualified" | "Proposal Sent" | "Won";

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
      case "Proposal Sent":
        return {
          dotColor: "text-purple-500",
          bgColor: "bg-purple-100 text-purple-700",
          darkBgColor: "dark:bg-purple-950 dark:text-purple-300",
        };
      case "Won":
        return {
          dotColor: "text-green-500",
          bgColor: "bg-green-100 text-green-700",
          darkBgColor: "dark:bg-green-950 dark:text-green-300",
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
      className={`inline-flex items-center gap-1.5 ${styles.bgColor} ${styles.darkBgColor} font-medium`}
      data-testid={`badge-stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Circle className={`h-2 w-2 fill-current ${styles.dotColor}`} />
      <span>{stage}</span>
    </Badge>
  );
}
