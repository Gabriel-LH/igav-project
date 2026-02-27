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
import { salesHistorySchema } from "../type/type.history";
import { BadgeX, Undo2 } from "lucide-react";
import { TableCellViewerHistory } from "./history-table-cell-viewer";
import { CancelSaleModal } from "../../ui/modals/CancelSaleModal";
import { useSaleStore } from "@/src/store/useSaleStore";
import { useState } from "react";
import { ReturnProductModal } from "../../ui/modals/ReturProductModal";
import { SaleWithItems } from "@/src/types/sales/type.sale";
import { CancelSaleUseCase } from "@/src/application/use-cases/cancelSale.usecase";
import { ZustandSaleRepository } from "@/src/infrastructure/stores-adapters/ZustandSaleRepository";
import { ZustandSaleReversalRepository } from "@/src/infrastructure/stores-adapters/ZustandSaleReversalRepository";
import { ZustandInventoryRepository } from "@/src/infrastructure/stores-adapters/ZustandInventoryRepository";
import { ZustandPaymentRepository } from "@/src/infrastructure/stores-adapters/ZustandPaymentRepository";
import { ZustandOperationRepository } from "@/src/infrastructure/stores-adapters/ZustandOperationRepository";
import { toast } from "sonner";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { canAnnulSale, canReturnSale } from "@/src/utils/times/saleTimeRules";
import { ReturnSaleItemsUseCase } from "@/src/application/use-cases/returnSaleItems.usecase";

export const columnsSalesHistory: ColumnDef<
  z.infer<typeof salesHistorySchema>
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
      return <TableCellViewerHistory item={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "product",
    header: "Producto",
    cell: ({ getValue }) => <div>{getValue<string>()}</div>,
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
    accessorKey: "saleDate",
    header: "Fecha de venta",
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
            {type === "anulado" && <BadgeX />}
            {type.replace("_", " ").toUpperCase()}
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
  row: { original: z.infer<typeof salesHistorySchema> };
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const item = row.original;

  const { sales, saleItems } = useSaleStore(); // Asumiendo que tienes un store de ventas

  const user = USER_MOCK[0];

  // 1. Buscamos la venta base
  const baseSale = sales.find((s) => s.id === item.id);

  // 2. Buscamos los items de esa venta
  const itemsOfSale = saleItems.filter((si) => si.saleId === item.id);

  // 3. Creamos el objeto unificado (SaleWithItems)
  const fullSaleData: SaleWithItems | undefined = baseSale
    ? { ...baseSale, items: itemsOfSale, charges: [] }
    : undefined;

  const handleCancelConfirm = async (id: string, reason: string) => {
    try {
      const cancelSaleUC = new CancelSaleUseCase(
        new ZustandSaleRepository(),
        new ZustandSaleReversalRepository(),
        new ZustandInventoryRepository(),
        new ZustandPaymentRepository(),
        new ZustandOperationRepository(),
      );

      cancelSaleUC.execute({
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

  const handleReturnConfirm = (
    saleId: string,
    reason: string,
    items: {
      saleItemId: string;
      condition?: "perfecto" | "dañado" | "manchado";
      restockingFee: number;
    }[],
  ) => {
    try {
      const returnSaleItemsUC = new ReturnSaleItemsUseCase(
        new ZustandSaleRepository(),
        new ZustandSaleReversalRepository(),
        new ZustandInventoryRepository(),
        new ZustandPaymentRepository(),
      );

      returnSaleItemsUC.execute({
        saleId,
        reason,
        items,
        userId: user.id,
      });

      toast.success("Devolución registrada", {
        description: "Los productos fueron devueltos correctamente",
      });

      setShowReturnModal(false);
    } catch (error) {
      toast.error("No se pudo devolver", {
        description: (error as Error).message,
      });
    }
  };

  if (!fullSaleData) {
    return null;
  }

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
          {canReturnSale(fullSaleData) && (
            <DropdownMenuItem onClick={() => setShowReturnModal(true)}>
              <Undo2 className="animate-pulse" />
              Realizar Retorno
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Solo Anular en Pendientes */}
          {canAnnulSale(fullSaleData) && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowCancelModal(true)}
            >
              <BadgeX className="animate-pulse" />
              Anular Venta
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CancelSaleModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        sale={fullSaleData}
        onConfirm={handleCancelConfirm}
      />

      <ReturnProductModal
        open={showReturnModal}
        onOpenChange={setShowReturnModal}
        sale={fullSaleData}
        onConfirm={handleReturnConfirm}
      />
    </>
  );
}
