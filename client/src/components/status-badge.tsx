import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, Clock } from "lucide-react";

type Status = "In Negotiation" | "Proposal Rejected" | "On Hold" | "" | null;

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <span className="text-muted-foreground" data-testid="text-status-empty">—</span>;

  const getStatusConfig = () => {
    switch (status) {
      case "In Negotiation":
        return {
          icon: TrendingUp,
          bgColor: "bg-yellow-100 text-yellow-800",
          darkBgColor: "dark:bg-yellow-950 dark:text-yellow-200",
        };
      case "Proposal Rejected":
        return {
          icon: AlertCircle,
          bgColor: "bg-red-100 text-red-800",
          darkBgColor: "dark:bg-red-950 dark:text-red-200",
        };
      case "On Hold":
        return {
          icon: Clock,
          bgColor: "bg-orange-100 text-orange-800",
          darkBgColor: "dark:bg-orange-950 dark:text-orange-200",
        };
      default:
        return {
          icon: null,
          bgColor: "bg-gray-100 text-gray-800",
          darkBgColor: "dark:bg-gray-900 dark:text-gray-200",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant="secondary"
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs ${config.bgColor} ${config.darkBgColor} font-medium`}
      data-testid={`badge-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {Icon && <Icon className="h-2.5 w-2.5" />}
      <span>{status}</span>
    </Badge>
  );
}
