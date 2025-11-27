import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Service } from "@shared/schema";

interface ServiceSelectProps {
  value: string;
  onChange: (value: string) => void;
  "data-testid"?: string;
}

export function ServiceSelect({ value, onChange, "data-testid": testId }: ServiceSelectProps) {
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const { toast } = useToast();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  const addServiceMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest('POST', '/api/services', { name });
    },
    onSuccess: (_, name) => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      onChange(name);
      setShowAddDialog(false);
      setNewServiceName("");
      toast({
        title: "Service added",
        description: `"${name}" has been added to the list of services.`,
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('409')) {
        toast({
          title: "Service already exists",
          description: "This service is already in the list. You can select it from the dropdown.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add service. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleAddService = () => {
    if (newServiceName.trim()) {
      addServiceMutation.mutate(newServiceName.trim());
    }
  };

  const selectedService = services.find(s => s.name === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            data-testid={testId}
          >
            {isLoading ? (
              "Loading..."
            ) : selectedService ? (
              selectedService.name
            ) : (
              "Select service..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search services..." />
            <CommandList>
              <CommandEmpty>No service found.</CommandEmpty>
              <CommandGroup>
                {services.map((service) => (
                  <CommandItem
                    key={service.id}
                    value={service.name}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    data-testid={`option-service-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === service.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {service.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowAddDialog(true);
                  }}
                  className="text-muted-foreground"
                  data-testid="button-add-new-service"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new service...
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Enter a name for the new service. This will be available for selection in all client forms.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-service-name">Service Name</Label>
            <Input
              id="new-service-name"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="e.g., Cloud Migration"
              className="mt-2"
              data-testid="input-new-service-name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewServiceName("");
              }}
              data-testid="button-cancel-add-service"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddService}
              disabled={!newServiceName.trim() || addServiceMutation.isPending}
              data-testid="button-confirm-add-service"
            >
              {addServiceMutation.isPending ? "Adding..." : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
