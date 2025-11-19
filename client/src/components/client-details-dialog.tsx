import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Calendar, CheckCircle2, Edit } from "lucide-react";
import { format } from "date-fns";
import type { Client } from "@shared/schema";
import { PriorityBadge } from "./priority-badge";
import { StageBadge } from "./stage-badge";
import { StatusBadge } from "./status-badge";

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  client: Client | null;
}

export function ClientDetailsDialog({ open, onOpenChange, onEdit, client }: ClientDetailsDialogProps) {
  if (!client) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "MM/dd/yyyy");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl font-semibold">
              {client.companyName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground mb-1">Priority</span>
                <PriorityBadge priority={client.priority as any} />
              </div>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Project Value</div>
              <div className="text-2xl font-bold">{formatCurrency(client.value)}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">Stage</div>
              <StageBadge stage={client.stage as any} />
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">Status</div>
              <StatusBadge status={client.status as any} />
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">Priority</div>
              <PriorityBadge priority={client.priority as any} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>
            <div className="bg-muted/10 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Contact Person</div>
                  <div className="font-semibold">{client.contactPerson}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Email</div>
                  <a
                    href={`mailto:${client.email}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Phone</div>
                  <div className="font-medium">{client.phone}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Follow-up Management</h3>
            </div>
            <div className="bg-muted/10 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Last Follow-up</div>
                  <div className="text-lg font-semibold">{formatDate(client.lastFollowUp)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Next Follow-up</div>
                  <div className="text-lg font-semibold">{formatDate(client.nextFollowUp)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-900">
              <p className="text-sm text-foreground">{client.notes || "No notes available."}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Activity History</h3>
            <div className="space-y-3">
              {client.activityHistory && client.activityHistory.length > 0 ? (
                client.activityHistory.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{activity.action}</div>
                      <div className="text-sm text-muted-foreground">by {activity.user}</div>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {activity.date}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No activity history available.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
