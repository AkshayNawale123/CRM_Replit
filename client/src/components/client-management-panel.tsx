import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { CountrySelect } from "./country-select";
import { getCurrencyByCountry, formatCurrencyByCountry } from "@/lib/country-currency-data";
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "MM/dd/yyyy");
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
          <div className="mb-4 text-4xl">👋</div>
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
      <div className="flex flex-col h-full">
        <div className="p-6 border-b bg-background">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold">{client.companyName}</h2>
              <p className="text-muted-foreground">{client.contactPerson}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeMode("edit")}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-3">
            <StageBadge stage={client.stage as any} />
            <StatusBadge status={client.status as any} />
            <PriorityBadge priority={client.priority as any} />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email
                    </div>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      Phone
                    </div>
                    <div className="text-sm font-medium">{client.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Country
                    </div>
                    <div className="text-sm font-medium">{client.country}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <User className="h-3 w-3" />
                      Responsible Person
                    </div>
                    <div className="text-sm font-medium">
                      {client.responsiblePerson}
                    </div>
                  </div>
                  {client.linkedin && (
                    <div className="col-span-2">
                      <div className="text-sm text-muted-foreground mb-1">
                        LinkedIn
                      </div>
                      <a
                        href={client.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {client.linkedin}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Deal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Deal Value
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(client.value)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Last Follow-up
                    </div>
                    <div className="text-lg font-semibold">
                      {formatDate(client.lastFollowUp)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Next Follow-up
                    </div>
                    <div className="text-lg font-semibold">
                      {formatDate(client.nextFollowUp)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {client.notes && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {client.activityHistory && client.activityHistory.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Activity History</h3>
                  <div className="space-y-3">
                    {client.activityHistory.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 pb-3 border-b last:border-0"
                      >
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {activity.action}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            by {activity.user}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Client
              </Button>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-6 border-b bg-background">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {mode === "create" ? "Add New Client" : "Edit Client"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corporation" {...field} />
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
                          <Input placeholder="John Smith" {...field} />
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
                            <SelectTrigger>
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
                            <SelectTrigger>
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
                            <SelectTrigger>
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

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Value ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="250000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="responsiblePerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsible Person</FormLabel>
                        <FormControl>
                          <Input placeholder="Sarah Johnson" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                          rows={4}
                          {...field}
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
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading
                      ? "Saving..."
                      : mode === "create"
                        ? "Add Client"
                        : "Save Changes"}
                  </Button>
                </div>
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
