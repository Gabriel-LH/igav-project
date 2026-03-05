"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { StoreLocation02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type Branch = {
  id: string;
  name: string;
};

interface SucursalSwitcherProps {
  branches: Branch[];
  value: string;
  onChange: (branchId: string) => void;
}

export function SucursalSwitcher({
  branches,
  value,
  onChange,
}: SucursalSwitcherProps) {
  const current = branches.find((b) => b.id === value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <HugeiconsIcon icon={StoreLocation02Icon} strokeWidth={2.2} />
            <span className="truncate">
              {current?.name ?? "Seleccionar sucursal"}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder="Buscar sucursal..." />
          <CommandEmpty>No hay resultados.</CommandEmpty>
          <CommandGroup>
            {branches.map((branch) => (
              <CommandItem
                key={branch.id}
                value={branch.name}
                onSelect={() => onChange(branch.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    branch.id === value ? "opacity-100" : "opacity-0"
                  )}
                />
                {branch.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
