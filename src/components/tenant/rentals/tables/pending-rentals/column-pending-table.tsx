"use client";

import { IconDotsVertical } from "@tabler/icons-react";
import { type ColumnDef } from "@tanstack/react-table";
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
import { DragHandle } from "@/src/components/tenant/dashboard/data-table/ui/DragHandle";
import { rentalsPendingSchema } from "../type/type.pending";
import { BadgeX, Handbag } from "lucide-react";
import { TableCellViewerPending } from "./pending-table-cell-viewer";
import { useState } from "react";
import { CancelRentalModal } from "../../ui/modals/CancelRentalModal";
import { useRentalStore } from "@/src/store/useRentalStore";
import { cancelRentalAction, deliverRentalAction } from "@/src/app/(tenant)/tenant/actions/operation.actions";
import { toast } from "sonner";
import { DeliverRentalModal } from "../../ui/modals/DeliverRentalModal";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";

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
    accessorKey: "nameCustomer",
    header: "Cliente",
    cell: ({ row }) => {
      return <TableCellViewerPending item={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "product",
    header: "Producto",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
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
    accessorKey: "status",
    header: "Estado",
    cell: () => {
      return (
        <div className="w-32">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            POR ENTREGAR
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell row={row} />,
  },
];

function ActionCell({
  row,
}: {
  row: { original: z.infer<typeof rentalsPendingSchema> };
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);

  const userId = "user_1"; // TODO: Get from auth if needed

  const item = row.original;

  const { rentals } = useRentalStore();
  const fullRentalData = rentals.find((r) => r.id === item.id);

  const handleCancelConfirm = async (id: string, reason: string) => {
    try {
      await cancelRentalAction(id, reason, userId);

      toast.success("Alquiler anulado", {
        description: "El alquiler fue anulado correctamente",
      });

      setShowCancelModal(false);
    } catch (error) {
      toast.error("No se pudo anular", {
        description: (error as Error).message,
      });
    }
  };

  if (!fullRentalData) {
    return null;
  }

  const handleDeliverRental = async (
    id: string,
    guarantee: { value: string; type: GuaranteeType },
    selectedIds?: string[],
  ) => {
    try {
      await deliverRentalAction(id, guarantee, userId, selectedIds);

      toast.success("Alquiler entregado", {
        description: "El alquiler fue entregado correctamente",
      });
      setShowDeliverModal(false);
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
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => {
              setShowDeliverModal(true);
            }}
          >
            <Handbag className="animate-pulse" />
            Entregar Alquiler
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowCancelModal(true)}
          >
            <BadgeX className="animate-pulse" />
            Anular Alquiler
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CancelRentalModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        rental={fullRentalData}
        onConfirm={handleCancelConfirm}
      />

      <DeliverRentalModal
        open={showDeliverModal}
        onOpenChange={setShowDeliverModal}
        rental={fullRentalData}
        customerName={item.nameCustomer}
        onConfirm={handleDeliverRental}
      />
    </>
  );
}
