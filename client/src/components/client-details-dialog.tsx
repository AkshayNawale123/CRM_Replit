import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, CheckCircle2, Edit, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client } from "@shared/schema";
import { PriorityBadge } from "./priority-badge";
import { StageBadge } from "./stage-badge";
import { StatusBadge } from "./status-badge";
import { useToast } from "@/hooks/use-toast";

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  client: Client | null;
}

export function ClientDetailsDialog({ open, onOpenChange, onEdit, client }: ClientDetailsDialogProps) {
  const [newActivity, setNewActivity] = useState({ action: "", user: "" });
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addActivityMutation = useMutation({
    mutationFn: async (activity: { action: string; user: string }) => {
      if (!client) throw new Error("No client selected");
      const response = await fetch(`/api/clients/${client.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activity),
      });
      if (!response.ok) throw new Error("Failed to add activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setNewActivity({ action: "", user: "" });
      setIsAddingActivity(false);
      toast({
        title: "Activity added",
        description: "The activity has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      if (!client) throw new Error("No client selected");
      const response = await fetch(`/api/clients/${client.id}/activities/${activityId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Activity deleted",
        description: "The activity has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddActivity = () => {
    if (newActivity.action.trim() && newActivity.user.trim()) {
      addActivityMutation.mutate(newActivity);
    }
  };

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

  if (!client) return null;

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
                {client.linkedin && (
                  <div className="col-span-3">
                    <div className="text-sm text-muted-foreground mb-1">LinkedIn</div>
                    <a
                      href={client.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {client.linkedin}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Account Management</h3>
            </div>
            <div className="bg-muted/10 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Last Follow-up</div>
                  <div className="text-lg font-semibold">{formatDate(client.lastFollowUp)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Next Follow-up</div>
                  <div className="text-lg font-semibold">{formatDate(client.nextFollowUp)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Responsible Person</div>
                  <div className="text-lg font-semibold">{client.responsiblePerson}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Country</div>
                  <div className="text-lg font-semibold">{client.country}</div>
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Activity History</h3>
              {!isAddingActivity && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingActivity(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Activity
                </Button>
              )}
            </div>
            
            {isAddingActivity && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Activity Description</label>
                  <Input
                    placeholder="e.g., Follow-up call completed"
                    value={newActivity.action}
                    onChange={(e) => setNewActivity({ ...newActivity, action: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Name</label>
                  <Input
                    placeholder="e.g., John Smith"
                    value={newActivity.user}
                    onChange={(e) => setNewActivity({ ...newActivity, user: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddActivity}
                    disabled={!newActivity.action.trim() || !newActivity.user.trim() || addActivityMutation.isPending}
                    size="sm"
                  >
                    {addActivityMutation.isPending ? "Adding..." : "Add"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingActivity(false);
                      setNewActivity({ action: "", user: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {client.activityHistory && client.activityHistory.length > 0 ? (
                client.activityHistory.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0 group">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{activity.action}</div>
                      <div className="text-sm text-muted-foreground">by {activity.user}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {activity.date}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteActivityMutation.mutate(activity.id)}
                        disabled={deleteActivityMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
