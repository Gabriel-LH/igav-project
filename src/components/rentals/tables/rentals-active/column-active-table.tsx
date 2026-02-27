"use client";

import { IconDotsVertical } from "@tabler/icons-react";
import { Row, type ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { DragHandle } from "@/src/components/dashboard/data-table/ui/DragHandle";
import { rentalsActiveSchema } from "../type/type.active";
import { ArrowUpDown, CircleDashed, CircleX, PencilLine } from "lucide-react";
import { TableCellViewerActive } from "./active-table-cell-viewer";
import { CancelRentalUseCase } from "@/src/application/use-cases/cancelRental.usecase";
import { ZustandRentalRepository } from "@/src/infrastructure/stores-adapters/ZustandRentalRepository";
import { ZustandInventoryRepository } from "@/src/infrastructure/stores-adapters/ZustandInventoryRepository";
import { ZustandGuaranteeRepository } from "@/src/infrastructure/stores-adapters/ZustandGuaranteeRepository";
import { ZustandPaymentRepository } from "@/src/infrastructure/stores-adapters/ZustandPaymentRepository";
import { ZustandOperationRepository } from "@/src/infrastructure/stores-adapters/ZustandOperationRepository";
import { useState } from "react";
import { useRentalStore } from "@/src/store/useRentalStore";
import { toast } from "sonner";
import { RentalWithItems } from "@/src/types/rentals/type.rentals";
import { CancelRentalModal } from "../../ui/modals/CancelRentalModal";
import { USER_MOCK } from "@/src/mocks/mock.user";

export const columnsRentalsActive: ColumnDef<
  z.infer<typeof rentalsActiveSchema>
>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={Number(row.original.id)} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "product",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Producto
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <TableCellViewerActive item={row.original} />,
  },
  {
    accessorKey: "nameCustomer",
    header: "Cliente",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "rent_unit",
    header: "Dia / Evento",
    cell: ({ getValue }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {getValue<string>().toUpperCase()}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "count",
    header: "Cantidad",
    cell: ({ getValue }) => <div className="w-32">{getValue<number>()}</div>,
  },
  {
    accessorKey: "income",
    header: "Ingreso",
    cell: ({ getValue }) => (
      <div className="w-32">S/. {getValue<number>()}</div>
    ),
  },
  {
    accessorKey: "outDate",
    header: "Fecha de salida",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "expectedReturnDate",
    header: "Fecha de devolucion",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ getValue }) => {
      const type = getValue() as string;
      return (
        <div className="w-32">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {type === "en_curso" && <CircleDashed />}
            {type.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "gurantee_type",
    header: "Garantia",
    cell: ({ getValue }) => (
      <div className="w-32">{getValue<string>().toUpperCase()}</div>
    ),
  },
  {
    accessorKey: "guarantee_status",
    header: "Estado de garantia",
    cell: ({ getValue }) => (
      <div className="w-32">
        {
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {getValue<string>().toUpperCase()}
          </Badge>
        }
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell row={row} />,
  },
];

function ActionCell({
  row,
}: {
  row: Row<z.infer<typeof rentalsActiveSchema>>;
}) {
  const [open, setOpen] = useState(false);

  const item = row.original;

  const { rentals, rentalItems } = useRentalStore();

  const baseRental = rentals.find((rental) => rental.id === item.id);

  const itemsOfRental = rentalItems.filter(
    (rentalItem) => rentalItem.rentalId === item.id,
  );

  const fullRentalData: RentalWithItems | undefined = baseRental
    ? {
        ...baseRental,
        items: itemsOfRental,
      }
    : undefined;

  const handleConfirm = async (rentalId: string, reason: string) => {
    try {
      const cancelUseCase = new CancelRentalUseCase(
        new ZustandRentalRepository(),
        new ZustandGuaranteeRepository(),
        new ZustandOperationRepository(),
        new ZustandPaymentRepository(),
      );
      cancelUseCase.execute(rentalId, reason, USER_MOCK[0].id);
      toast.success("Alquiler cancelado exitosamente");
      setOpen(false);
    } catch (error) {
      toast.error("Error al cancelar el alquiler");
    }
  };

  if (!fullRentalData) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>
            <PencilLine /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem>Hacer una copia</DropdownMenuItem>
          <DropdownMenuItem>Favorito</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setOpen(true)}
            className="text-red-500"
          >
            {" "}
            <CircleX /> Anular
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CancelRentalModal
        open={open}
        onOpenChange={setOpen}
        rental={fullRentalData}
        onConfirm={handleConfirm}
      />
    </>
  );
}
