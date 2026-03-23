import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/label";
import React from "react";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { CreateClientModal } from "@/src/components/tenant/client/ui/modals/CreateClientModal";
import { getClientsAction } from "@/src/app/(tenant)/tenant/actions/client.actions";
import { toast } from "sonner";
import { Client } from "@/src/types/clients/type.client";

export function CustomerSelector({
  selected,
  onSelect,
}: {
  selected?: Client | null;
  onSelect: (client: Client) => void;
}) {
  const { customers, setCustomers } = useCustomerStore();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    const loadClients = async () => {
      const result = await getClientsAction();
      if (cancelled) return;

      if (!result.success || !result.data) {
        toast.error(result.error || "No se pudieron cargar los clientes");
        return;
      }

      setCustomers(result.data);
    };

    loadClients();

    return () => {
      cancelled = true;
    };
  }, [setCustomers]);

  return (
    <div>
      <Label className="text-[11px] mb-0.5 font-bold uppercase">
        Asociar Cliente
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full font-normal justify-between h-12"
          >
            {value
              ? selected?.firstName + " " + selected?.lastName
              : "Buscar por nombre o DNI..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput
              placeholder="Escribe el DNI o nombre..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>
              <div className="p-4 text-center">
                <p className="text-sm mb-2">No se encontró el cliente</p>

                <CreateClientModal
                  onCreated={(newClient) => {
                    setValue(newClient.firstName + " " + newClient.lastName);
                    onSelect(newClient);
                    setOpen(false);
                  }}
                  defaultValues={{ dni: search }}
                >
                  <Button size="sm" variant="outline" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Crear nuevo cliente
                  </Button>
                </CreateClientModal>
              </div>
            </CommandEmpty>

            <CommandGroup>
              {customers.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.firstName} ${client.lastName} ${client.dni}`}
                  onSelect={() => {
                    setValue(client.firstName + " " + client.lastName);
                    onSelect(client);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.firstName ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{client.firstName + " " + client.lastName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      DNI: {client.dni}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
