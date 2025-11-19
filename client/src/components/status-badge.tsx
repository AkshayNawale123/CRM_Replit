import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, Clock, Search, FileText, BarChart, DollarSign } from "lucide-react";

type Status = 
  | "In Negotiation"
  | "Proposal Rejected"
  | "On Hold"
  | "Pending Review"
  | "Awaiting Response"
  | "Under Evaluation"
  | "Budget Approval Pending"
  | ""
  | null;

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
      case "Pending Review":
        return {
          icon: FileText,
          bgColor: "bg-blue-100 text-blue-800",
          darkBgColor: "dark:bg-blue-950 dark:text-blue-200",
        };
      case "Awaiting Response":
        return {
          icon: Clock,
          bgColor: "bg-cyan-100 text-cyan-800",
          darkBgColor: "dark:bg-cyan-950 dark:text-cyan-200",
        };
      case "Under Evaluation":
        return {
          icon: Search,
          bgColor: "bg-purple-100 text-purple-800",
          darkBgColor: "dark:bg-purple-950 dark:text-purple-200",
        };
      case "Budget Approval Pending":
        return {
          icon: DollarSign,
          bgColor: "bg-green-100 text-green-800",
          darkBgColor: "dark:bg-green-950 dark:text-green-200",
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
