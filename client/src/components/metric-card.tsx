import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function MetricCard({ title, value, icon: Icon, variant = "default" }: MetricCardProps) {
  const getIconColor = () => {
    switch (variant) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "danger":
        return "text-red-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "danger":
        return "text-red-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-3">
        <div className="flex flex-col gap-1">
          <Icon className={`h-4 w-4 ${getIconColor()}`} data-testid={`icon-${title.toLowerCase().replace(/\s+/g, '-')}`} />
          <div className="flex flex-col gap-0.5">
            <p className={`text-2xl font-bold ${getValueColor()}`} data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            <p className="text-xs font-medium text-muted-foreground" data-testid={`text-label-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {title}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
