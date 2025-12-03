import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { clientFormSchema, type ClientFormData, type InsertClient, type Client, stageOptions, priorityOptions, getStatusOptionsForStage } from "@shared/schema";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { CountrySelect } from "./country-select";
import { ServiceSelect } from "./service-select";
import { getCurrencyByCountry } from "@/lib/country-currency-data";

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertClient) => void;
  onDelete?: () => void;
  client?: Client;
  isLoading?: boolean;
}

export function ClientDialog({ open, onOpenChange, onSubmit, onDelete, client, isLoading }: ClientDialogProps) {
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
      nextFollowUp: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      priority: "Medium" as const,
      responsiblePerson: "",
      country: "",
      service: "",
      linkedin: "",
      notes: "",
    },
  });

  // Watch the stage field to dynamically filter status options
  const selectedStage = form.watch("stage");
  const availableStatuses = getStatusOptionsForStage(selectedStage);

  // Reset status when stage changes and current status is not valid for new stage
  useEffect(() => {
    const currentStatus = form.getValues("status");
    if (currentStatus && !availableStatuses.includes(currentStatus)) {
      form.setValue("status", null);
    }
  }, [selectedStage, availableStatuses]);

  useEffect(() => {
    if (open && client) {
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
    } else if (open && !client) {
      form.reset({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        stage: "Lead",
        status: null,
        value: 0,
        lastFollowUp: format(new Date(), "yyyy-MM-dd"),
        nextFollowUp: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        priority: "Medium",
        responsiblePerson: "",
        country: "",
        service: "",
        linkedin: "",
        notes: "",
      });
    }
  }, [open, client]);

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {client ? "Edit Client" : "Add New Client"}
            </DialogTitle>
            <DialogDescription>
              {client
                ? "Update client information and deal details."
                : "Enter client information to add them to your pipeline."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Acme Corporation" 
                          {...field} 
                          data-testid="input-company-name"
                        />
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
                        <Input 
                          placeholder="John Smith" 
                          {...field} 
                          data-testid="input-contact-person"
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-stage">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stageOptions.map((stage) => (
                            <SelectItem key={stage} value={stage} data-testid={`option-stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}>
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
                          {availableStatuses.map((status) => (
                            <SelectItem 
                              key={status ?? 'none'} 
                              value={status ?? "__none__"} 
                              data-testid={`option-status-${status ? status.toLowerCase().replace(/\s+/g, '-') : 'none'}`}
                            >
                              {status ?? 'None'}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityOptions.map((priority) => (
                            <SelectItem key={priority} value={priority} data-testid={`option-priority-${priority.toLowerCase()}`}>
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
                    <FormLabel>Deal Value (Currency as per Country)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="250000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-value"
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
                        <Input 
                          placeholder="Sarah Johnson" 
                          {...field} 
                          data-testid="input-responsible-person"
                        />
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

              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <FormControl>
                      <ServiceSelect
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        data-testid="select-service"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          value={typeof field.value === 'string' ? field.value : ''}
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
                          value={typeof field.value === 'string' ? field.value : ''}
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
                        rows={4}
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                {client && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="mr-auto gap-2"
                    data-testid="button-delete"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  data-testid="button-save"
                >
                  {isLoading ? "Saving..." : client ? "Save Changes" : "Add Client"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-delete-confirm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
