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
import { BadgeX } from "lucide-react";
import { TableCellViewerPending } from "./pending-table-cell-viewer";
import { Sale } from "@/src/types/sales/type.sale";
import { useState } from "react";
import { CancelSaleModal } from "../../ui/modals/CancelSaleModal";
import { useSaleStore } from "@/src/store/useSaleStore";

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
    accessorKey: "outDate",
    header: "Fecha de salida",
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
  row: { original: z.infer<typeof salesPendingSchema> };
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);

  const item = row.original;

  const { sales } = useSaleStore(); // Asumiendo que tienes un store de ventas
  const fullSaleData = sales.find((s) => s.id === item.id);

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
          <DropdownMenuItem
            onClick={() => {
              /* Tu lógica de editar */
            }}
          >
            Editar Venta
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Solo Anular en Pendientes */}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowCancelModal(true)}
          >
            <BadgeX className="animate-pulse"/>
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
    </>
  );
}
