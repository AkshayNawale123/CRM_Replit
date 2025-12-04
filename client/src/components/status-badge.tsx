import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, Pause, FileSearch, Mail, Search, DollarSign } from "lucide-react";

type Status = 
  | "None"
  | "In Negotiation"
  | "Proposal Rejected"
  | "On Hold"
  | "Pending Review"
  | "Awaiting Response"
  | "Under Evaluation"
  | "Budget Approval Pending";

interface StatusBadgeProps {
  status: Status | string | null;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case "In Negotiation":
        return {
          icon: AlertCircle,
          bgColor: "bg-purple-100 text-purple-700",
          darkBgColor: "dark:bg-purple-950 dark:text-purple-300",
        };
      case "Proposal Rejected":
        return {
          icon: AlertCircle,
          bgColor: "bg-red-100 text-red-700",
          darkBgColor: "dark:bg-red-950 dark:text-red-300",
        };
      case "On Hold":
        return {
          icon: Pause,
          bgColor: "bg-orange-100 text-orange-700",
          darkBgColor: "dark:bg-orange-950 dark:text-orange-300",
        };
      case "Pending Review":
        return {
          icon: FileSearch,
          bgColor: "bg-yellow-100 text-yellow-700",
          darkBgColor: "dark:bg-yellow-950 dark:text-yellow-300",
        };
      case "Awaiting Response":
        return {
          icon: Mail,
          bgColor: "bg-blue-100 text-blue-700",
          darkBgColor: "dark:bg-blue-950 dark:text-blue-300",
        };
      case "Under Evaluation":
        return {
          icon: Search,
          bgColor: "bg-indigo-100 text-indigo-700",
          darkBgColor: "dark:bg-indigo-950 dark:text-indigo-300",
        };
      case "Budget Approval Pending":
        return {
          icon: DollarSign,
          bgColor: "bg-green-100 text-green-700",
          darkBgColor: "dark:bg-green-950 dark:text-green-300",
        };
      case "None":
      default:
        return {
          icon: Clock,
          bgColor: "bg-gray-100 text-gray-700",
          darkBgColor: "dark:bg-gray-900 dark:text-gray-300",
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
