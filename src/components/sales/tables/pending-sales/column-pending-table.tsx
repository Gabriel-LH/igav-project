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
import { DragHandle } from "@/src/components/dashboard/data-table/ui/DragHandle";
import { salesPendingSchema } from "../type/type.pending";
import { BadgeX, Handbag } from "lucide-react";
import { TableCellViewerPending } from "./pending-table-cell-viewer";
import { useState } from "react";
import { CancelSaleModal } from "../../ui/modals/CancelSaleModal";
import { useSaleStore } from "@/src/store/useSaleStore";
import { CancelSaleUseCase } from "@/src/application/use-cases/cancelSale.usecase";
import { toast } from "sonner";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { DeliverSaleUseCase } from "@/src/application/use-cases/deliverSale.usecase";
import { ZustandSaleRepository } from "@/src/infrastructure/stores-adapters/ZustandSaleRepository";
import { ZustandSaleReversalRepository } from "@/src/infrastructure/stores-adapters/ZustandSaleReversalRepository";
import { ZustandInventoryRepository } from "@/src/infrastructure/stores-adapters/ZustandInventoryRepository";
import { ZustandPaymentRepository } from "@/src/infrastructure/stores-adapters/ZustandPaymentRepository";
import { ZustandOperationRepository } from "@/src/infrastructure/stores-adapters/ZustandOperationRepository";
import { ZustandReservationRepository } from "@/src/infrastructure/stores-adapters/ZustandReservationRepository";
import { DeliverSaleModal } from "../../ui/modals/DeliverSaleModal";

export const columnsSalesPending: ColumnDef<
  z.infer<typeof salesPendingSchema>
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
    accessorKey: "createdAt",
    header: "Fecha de registro",
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
  row: { original: z.infer<typeof salesPendingSchema> };
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);

  const user = USER_MOCK[0];

  const item = row.original;

  const { sales } = useSaleStore(); // Asumiendo que tienes un store de ventas
  const fullSaleData = sales.find((s) => s.id === item.id);

  const handleCancelConfirm = async (id: string, reason: string) => {
    try {
      const cancelUseCase = new CancelSaleUseCase(
        new ZustandSaleRepository(),
        new ZustandSaleReversalRepository(),
        new ZustandInventoryRepository(),
        new ZustandPaymentRepository(),
        new ZustandOperationRepository(),
      );
      cancelUseCase.execute({
        saleId: id,
        reason,
        userId: user.id,
      });

      toast.success("Venta anulada", {
        description: "La venta fue anulada correctamente",
      });

      setShowCancelModal(false);
    } catch (error) {
      toast.error("No se pudo anular", {
        description: (error as Error).message,
      });
    }
  };

  if (!fullSaleData) {
    return null;
  }

  const handleDeliverSale = async (id: string) => {
    try {
      const deliverUseCase = new DeliverSaleUseCase(
        new ZustandSaleRepository(),
        new ZustandInventoryRepository(),
        new ZustandReservationRepository(),
      );
      deliverUseCase.execute(id, user.id);

      toast.success("Venta entregada", {
        description: "La venta fue entregada correctamente",
      });
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
            Entregar Venta
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Solo Anular en Pendientes */}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowCancelModal(true)}
          >
            <BadgeX className="animate-pulse" />
            Anular Venta
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CancelSaleModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        sale={fullSaleData}
        onConfirm={handleCancelConfirm}
      />

      <DeliverSaleModal
        open={showDeliverModal}
        onOpenChange={setShowDeliverModal}
        sale={fullSaleData}
        onConfirm={handleDeliverSale}
      />
    </>
  );
}
