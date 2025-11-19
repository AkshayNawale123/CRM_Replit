import { Badge } from "@/components/ui/badge";

type Priority = "High" | "Medium" | "Low";

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const getPriorityStyles = () => {
    switch (priority) {
      case "High":
        return {
          bgColor: "bg-red-50 text-red-700 border-red-200",
          darkBgColor: "dark:bg-red-950 dark:text-red-300 dark:border-red-900",
        };
      case "Medium":
        return {
          bgColor: "bg-yellow-50 text-yellow-700 border-yellow-200",
          darkBgColor: "dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-900",
        };
      case "Low":
        return {
          bgColor: "bg-gray-50 text-gray-700 border-gray-200",
          darkBgColor: "dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800",
        };
      default:
        return {
          bgColor: "bg-gray-50 text-gray-700 border-gray-200",
          darkBgColor: "dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800",
        };
    }
  };

  const styles = getPriorityStyles();

  return (
    <Badge 
      variant="outline"
      className={`${styles.bgColor} ${styles.darkBgColor} font-medium uppercase text-xs`}
      data-testid={`badge-priority-${priority.toLowerCase()}`}
    >
      {priority}
    </Badge>
  );
}
