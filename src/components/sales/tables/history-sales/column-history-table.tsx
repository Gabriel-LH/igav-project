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
    accessorKey: "sellerName",
    header: "Vendedor",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "branchName",
    header: "Sucursal",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
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

  // 1. Buscamos la venta base
  const baseSale = sales.find((s) => s.id === item.id);

  // 2. Buscamos los items de esa venta
  const itemsOfSale = saleItems.filter((si) => si.saleId === item.id);

  // 3. Creamos el objeto unificado (SaleWithItems)
  const fullSaleData: SaleWithItems | undefined = baseSale
    ? { ...baseSale, items: itemsOfSale }
    : undefined;

  const handleCancelConfirm = async (id: string, reason: string) => {
    try {
      // Tu servicio de anulación
      console.log("Anulando venta ID:", id, "Motivo:", reason);
      setShowCancelModal(false);
    } catch (error) {
      console.error(error);
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
          <DropdownMenuItem onClick={() => setShowReturnModal(true)}>

            <Undo2 className="animate-pulse"/>
            Realizar Retorno
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

      <ReturnProductModal
        open={showReturnModal}
        onOpenChange={setShowReturnModal}
        sale={fullSaleData}
      />
    </>
  );
}
