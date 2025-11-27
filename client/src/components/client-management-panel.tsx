import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  clientFormSchema,
  type ClientFormData,
  type InsertClient,
  type Client,
  stageOptions,
  statusOptions,
  priorityOptions,
} from "@shared/schema";
import { format } from "date-fns";
import {
  Trash2,
  Edit,
  X,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  Globe,
  CalendarPlus,
  Send,
  RefreshCw,
  FileText,
  Briefcase,
} from "lucide-react";
import { CountrySelect } from "./country-select";
import { ServiceSelect } from "./service-select";
import { formatCurrencyByCountry } from "@/lib/country-currency-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { StageBadge } from "./stage-badge";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import crmBackgroundImage from "@assets/Cybaem_Tech_CRM_1763559987158.png";

interface ClientManagementPanelProps {
  client?: Client;
  onSubmit: (data: InsertClient) => void;
  onDelete?: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode: "view" | "edit" | "create";
  onChangeMode: (mode: "view" | "edit" | "create") => void;
}

export function ClientManagementPanel({
  client,
  onSubmit,
  onDelete,
  onCancel,
  isLoading,
  mode,
  onChangeMode,
}: ClientManagementPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      stage: "Lead" as const,
      status: null,
      value: 0,
      lastFollowUp: format(new Date(), "yyyy-MM-dd"),
      nextFollowUp: format(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd",
      ),
      priority: "Medium" as const,
      responsiblePerson: "",
      country: "",
      service: "",
      linkedin: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (client && (mode === "view" || mode === "edit")) {
      form.reset({
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        stage: client.stage as ClientFormData["stage"],
        status: client.status as ClientFormData["status"],
        value: client.value,
        lastFollowUp: format(new Date(client.lastFollowUp), "yyyy-MM-dd"),
        nextFollowUp: format(new Date(client.nextFollowUp), "yyyy-MM-dd"),
        priority: client.priority as ClientFormData["priority"],
        responsiblePerson: client.responsiblePerson,
        country: client.country,
        service: client.service || "",
        linkedin: client.linkedin || "",
        notes: client.notes || "",
      });
    } else if (mode === "create") {
      form.reset({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        stage: "Lead",
        status: null,
        value: 0,
        lastFollowUp: format(new Date(), "yyyy-MM-dd"),
        nextFollowUp: format(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          "yyyy-MM-dd",
        ),
        priority: "Medium",
        responsiblePerson: "",
        country: "",
        service: "",
        linkedin: "",
        notes: "",
      });
    }
  }, [client, mode]);

  const handleSubmit = (data: ClientFormData) => {
    onSubmit({
      ...data,
      activityHistory: client?.activityHistory || [],
    } as unknown as InsertClient);
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.();
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "yyyy-MM-dd");
  };

  if (!client && mode === "view") {
    return (
      <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${crmBackgroundImage})`,
            opacity: 0.9,
          }}
        />
        <div className="relative z-10 text-center p-8 max-w-md bg-background/80 backdrop-blur-sm rounded-lg shadow-lg">
          <div className="mb-4">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Welcome to Client Management
          </h3>
          <p className="text-muted-foreground mb-6">
            Select a client from the list to view their details, or create a new
            client to get started.
          </p>
          <Button
            onClick={() => onChangeMode("create")}
            className="gap-2"
            data-testid="button-create-first-client"
          >
            <User className="h-4 w-4" />
            Create Your First Client
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "view" && client) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate" data-testid="text-client-name">
                {client.companyName}
              </h2>
              <p className="text-sm text-muted-foreground">{client.contactPerson}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onChangeMode("edit")}
                data-testid="button-edit-client"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onCancel} data-testid="button-close-client">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Badge row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <StageBadge stage={client.stage as any} />
            <PriorityBadge priority={client.priority as any} />
            {client.service && (
              <Badge 
                variant="outline" 
                className="bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700"
              >
                {client.service}
              </Badge>
            )}
            <StatusBadge status={client.status as any} />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Two-column layout for Contact & Deal Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <a
                        href={`mailto:${client.email}`}
                        className="text-sm font-medium text-blue-600 hover:underline break-all"
                        data-testid="link-email"
                      >
                        {client.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Phone</div>
                      <div className="text-sm font-medium">{client.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Country</div>
                      <div className="text-sm font-medium">{client.country}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Responsible Person</div>
                      <div className="text-sm font-medium">{client.responsiblePerson}</div>
                    </div>
                  </div>
                  {client.linkedin && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">LinkedIn</div>
                        <a
                          href={client.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline break-all"
                        >
                          {client.linkedin}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Deal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  Deal Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Deal Value</div>
                      <div className="text-xl font-bold" data-testid="text-deal-value">
                        {formatCurrencyByCountry(client.value, client.country)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Stage</div>
                      <div className="text-sm font-medium">{client.stage}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Last Follow-up</div>
                      <div className="text-sm font-medium">{formatDate(client.lastFollowUp)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Next Follow-up</div>
                      <div className="text-sm font-medium">{formatDate(client.nextFollowUp)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Activities Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                Notes & Activities
              </h3>
              
              {/* Notes */}
              {client.notes ? (
                <div className="bg-muted/30 rounded-md p-3">
                  <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last updated: {formatDate(client.lastFollowUp)}
                  </p>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-md p-3 text-sm text-muted-foreground">
                  No notes yet
                </div>
              )}

              {/* Add Note button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onChangeMode("edit")}
                data-testid="button-add-note"
              >
                Add Note
              </Button>

              {/* Activity History */}
              {client.activityHistory && client.activityHistory.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Recent Activity
                  </h4>
                  <div className="space-y-2">
                    {client.activityHistory.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{activity.action}</span>
                          <span className="text-muted-foreground"> by {activity.user}</span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Action Bar */}
        <div className="p-4 border-t bg-background space-y-2">
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={() => onChangeMode("edit")}
              data-testid="button-schedule-followup"
            >
              <CalendarPlus className="h-4 w-4" />
              Schedule Follow-up
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => window.location.href = `mailto:${client.email}`}
              data-testid="button-send-email"
            >
              <Send className="h-4 w-4" />
              Send Email
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => onChangeMode("edit")}
              data-testid="button-update-status"
            >
              <RefreshCw className="h-4 w-4" />
              Update Status
            </Button>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              className="w-full gap-2 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
              data-testid="button-delete-client"
            >
              <Trash2 className="h-4 w-4" />
              Delete Client
            </Button>
          )}
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this client? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Create / Edit Mode
  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {mode === "create" ? "Add New Client" : "Edit Client"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corporation" {...field} data-testid="input-company-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} data-testid="input-contact-person" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@acme.com"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 234-567-8900"
                            {...field}
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-stage">
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stageOptions.map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {stage}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "__none__" ? null : value)}
                          value={field.value ?? "__none__"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem
                                key={status ?? "none"}
                                value={status ?? "__none__"}
                              >
                                {status ?? "None"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorityOptions.map((priority) => (
                              <SelectItem key={priority} value={priority}>
                                {priority}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <CountrySelect
                            value={field.value}
                            onChange={(value) => field.onChange(value)}
                            data-testid="input-country"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Value (Currency as per Country)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="250000"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            data-testid="input-value"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="responsiblePerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsible Person</FormLabel>
                        <FormControl>
                          <Input placeholder="Sarah Johnson" {...field} data-testid="input-responsible-person" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Interested In</FormLabel>
                        <FormControl>
                          <ServiceSelect
                            value={field.value || ""}
                            onChange={(value) => field.onChange(value)}
                            data-testid="input-service"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lastFollowUp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Follow-up</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={
                              typeof field.value === "string" ? field.value : ""
                            }
                            data-testid="input-last-followup"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nextFollowUp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Follow-up</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={
                              typeof field.value === "string" ? field.value : ""
                            }
                            data-testid="input-next-followup"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://www.linkedin.com/in/profile"
                          {...field}
                          data-testid="input-linkedin"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add notes about this client..."
                          rows={3}
                          {...field}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1" data-testid="button-submit">
                    {isLoading
                      ? "Saving..."
                      : mode === "create"
                        ? "Add Client"
                        : "Save Changes"}
                  </Button>
                </div>

                {mode === "edit" && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full gap-2"
                    data-testid="button-delete"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Client
                  </Button>
                )}
              </form>
            </Form>
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
