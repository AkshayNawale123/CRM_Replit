import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Mail, 
  Phone, 
  Globe, 
  Linkedin, 
  DollarSign, 
  Briefcase, 
  Clock, 
  User, 
  Calendar,
  Plus,
  Trash2
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client } from "@shared/schema";
import { PriorityBadge } from "./priority-badge";
import { StageBadge } from "./stage-badge";
import { SimplePipelineTracker } from "./pipeline-tracker";
import { StageTimeline } from "./stage-timeline";
import { useToast } from "@/hooks/use-toast";
import { convertToINR, formatINR, formatCurrencyByCountry } from "@/lib/country-currency-data";

interface ClientDetailPanelProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientDetailPanel({ client, isOpen, onClose }: ClientDetailPanelProps) {
  const [newActivity, setNewActivity] = useState({ action: "", user: "" });
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "MM/dd/yyyy");
  };

  const getDaysInPipeline = (pipelineStartDate: Date | string | undefined, createdAt: Date | string) => {
    const startDate = pipelineStartDate 
      ? (typeof pipelineStartDate === "string" ? new Date(pipelineStartDate) : pipelineStartDate)
      : (typeof createdAt === "string" ? new Date(createdAt) : createdAt);
    const today = new Date();
    const days = differenceInDays(today, startDate);
    return Math.max(0, days);
  };

  if (!client) return null;

  const valueINR = convertToINR(client.value, client.country);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={onClose}
          data-testid="panel-overlay"
        />
      )}
      
      <div 
        className={`fixed top-0 right-0 h-full bg-background border-l border-border shadow-xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '400px' }}
        role="dialog"
        aria-label="Client Details"
        data-testid="client-detail-panel"
      >
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground truncate" data-testid="panel-title">
            Client Details
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close panel"
            data-testid="button-close-panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-57px)]">
          <div className="p-4 space-y-5">
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold text-foreground" data-testid="panel-client-name">
                  {client.companyName}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="panel-contact-person">
                  {client.contactPerson}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <StageBadge stage={client.stage as any} />
                <PriorityBadge priority={client.priority as any} />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pipeline Progress</h4>
              <SimplePipelineTracker 
                currentStage={client.stage} 
                currentStatus={client.status} 
              />
            </div>

            <StageTimeline 
              clientId={client.id}
              currentStage={client.stage}
              currentStageEnteredAt={client.pipelineStartDate || client.createdAt}
            />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Contact Information
              </h4>
              <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Email</div>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-sm font-medium text-blue-600 hover:underline truncate block"
                      data-testid="panel-email"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="text-sm font-medium" data-testid="panel-phone">{client.phone}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Country</div>
                    <div className="text-sm font-medium" data-testid="panel-country">{client.country}</div>
                  </div>
                </div>
                
                {client.linkedin && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">LinkedIn</div>
                      <a
                        href={client.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline truncate block"
                        data-testid="panel-linkedin"
                      >
                        {client.linkedin}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Deal Information
              </h4>
              <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Deal Value</div>
                    <div className="text-sm font-bold" data-testid="panel-deal-value">
                      {formatCurrencyByCountry(client.value, client.country)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Converted Value</div>
                    <div className="text-sm font-bold text-muted-foreground" data-testid="panel-value-inr">
                      {formatINR(valueINR)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Service</div>
                    <div className="text-sm font-medium" data-testid="panel-service">
                      {client.service || '-'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Source</div>
                    <div className="text-sm font-medium" data-testid="panel-source">
                      {client.source || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Industry</div>
                    <div className="text-sm font-medium" data-testid="panel-industry">
                      {client.industry || '-'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Days in Pipeline</div>
                    <div className="text-sm font-medium" data-testid="panel-days-pipeline">
                      {getDaysInPipeline(client.pipelineStartDate, client.createdAt)} days
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Management
              </h4>
              <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Responsible Person</div>
                    <div className="text-sm font-medium" data-testid="panel-responsible">
                      {client.responsiblePerson}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Last Follow-up</div>
                    <div className="text-sm font-medium" data-testid="panel-last-followup">
                      {formatDate(client.lastFollowUp)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Notes</h4>
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200 dark:border-amber-900">
                <p className="text-sm text-foreground" data-testid="panel-notes">
                  {client.notes || "No notes available."}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Activity History</h4>
                {!isAddingActivity && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingActivity(true)}
                    className="gap-1 h-7 px-2 text-xs"
                    data-testid="button-add-activity"
                  >
                    <Plus className="h-3 w-3" />
                    Add Activity
                  </Button>
                )}
              </div>
              
              {isAddingActivity && (
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Activity Description</label>
                    <Input
                      placeholder="e.g., Follow-up call completed"
                      value={newActivity.action}
                      onChange={(e) => setNewActivity({ ...newActivity, action: e.target.value })}
                      className="h-8 text-sm"
                      data-testid="input-activity-description"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Your Name</label>
                    <Input
                      placeholder="e.g., John Smith"
                      value={newActivity.user}
                      onChange={(e) => setNewActivity({ ...newActivity, user: e.target.value })}
                      className="h-8 text-sm"
                      data-testid="input-activity-user"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddActivity}
                      disabled={!newActivity.action.trim() || !newActivity.user.trim() || addActivityMutation.isPending}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      data-testid="button-submit-activity"
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
                      className="h-7 px-2 text-xs"
                      data-testid="button-cancel-activity"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {client.activityHistory && client.activityHistory.length > 0 ? (
                  client.activityHistory.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-2 pb-2 border-b last:border-0 group"
                      data-testid={`activity-item-${activity.id}`}
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm">{activity.action}</div>
                        <div className="text-xs text-muted-foreground">by {activity.user}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.date}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteActivityMutation.mutate(activity.id)}
                          disabled={deleteActivityMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          data-testid={`button-delete-activity-${activity.id}`}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground" data-testid="text-no-activities">
                    No activity history available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
