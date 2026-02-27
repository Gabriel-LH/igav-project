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
import { rentalsPendingSchema } from "../type/type.pending";
import { ArrowUpDown, BadgeX, CircleDashed, Handbag } from "lucide-react";
import { TableCellViewerPending } from "./pending-table-cell-viewer";
import { CancelRentalUseCase } from "@/src/application/use-cases/cancelRental.usecase";
import { toast } from "sonner";
import { useRentalStore } from "@/src/store/useRentalStore";
import { useState } from "react";
import { RentalWithItems } from "@/src/types/rentals/type.rentals";
import { CancelRentalModal } from "../../ui/modals/CancelRentalModal";
import { DeliverRentalUseCase } from "@/src/application/use-cases/deliverRental.usecase";
import { ZustandRentalRepository } from "@/src/infrastructure/stores-adapters/ZustandRentalRepository";
import { ZustandInventoryRepository } from "@/src/infrastructure/stores-adapters/ZustandInventoryRepository";
import { ZustandReservationRepository } from "@/src/infrastructure/stores-adapters/ZustandReservationRepository";
import { ZustandGuaranteeRepository } from "@/src/infrastructure/stores-adapters/ZustandGuaranteeRepository";
import { ZustandPaymentRepository } from "@/src/infrastructure/stores-adapters/ZustandPaymentRepository";
import { ZustandOperationRepository } from "@/src/infrastructure/stores-adapters/ZustandOperationRepository";
import { DeliverRentalModal } from "../../ui/modals/DeliverRentalModal";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { USER_MOCK } from "@/src/mocks/mock.user";

export const columnsRentalsPending: ColumnDef<
  z.infer<typeof rentalsPendingSchema>
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
    cell: ({ row }) => <TableCellViewerPending item={row.original} />,
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
    header: "Fecha de Recojo",
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
    header: "Tipo de Garantia",
    cell: ({ getValue }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {getValue<string>().toUpperCase().split("_").join(" ")}
        </Badge>
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
  row: Row<z.infer<typeof rentalsPendingSchema>>;
}) {
  const [openCancel, setOpenCancel] = useState(false);
  const [openDeliver, setOpenDeliver] = useState(false);

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
      setOpenCancel(false);
    } catch (error) {
      toast.error("Error al cancelar el alquiler");
    }
  };

  if (!fullRentalData) return null;

  const handleDeliverRental = async (
    id: string,
    guaranteeData: { type: GuaranteeType; value: string },
  ) => {
    try {
      const deliverUseCase = new DeliverRentalUseCase(
        new ZustandRentalRepository(),
        new ZustandInventoryRepository(),
        new ZustandReservationRepository(),
        new ZustandGuaranteeRepository(),
      );
      deliverUseCase.execute(id, guaranteeData, "user_1");

      toast.success("Alquiler entregado", {
        description: "El alquiler fue entregado correctamente",
      });
      setOpenDeliver(false);
    } catch (error) {
      toast.error("No se pudo entregar", {
        description: (error as Error).message,
      });
    }
  };

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
          <DropdownMenuItem onClick={() => setOpenDeliver(true)}>
            <Handbag className="animate-pulse" /> Entregar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setOpenCancel(true)}
          >
            <BadgeX className="animate-pulse" /> Anular
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CancelRentalModal
        open={openCancel}
        onOpenChange={setOpenCancel}
        rental={fullRentalData}
        onConfirm={handleConfirm}
      />
      <DeliverRentalModal
        open={openDeliver}
        onOpenChange={setOpenDeliver}
        rental={fullRentalData}
        onConfirm={handleDeliverRental}
      />
    </>
  );
}
