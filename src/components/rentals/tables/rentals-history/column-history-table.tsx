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
import { TableCellViewerHistory } from "./history-table-cell-viewer";
import { rentalsHistorySchema } from "../type/type.history";
import {
  BadgeCheck,
  BadgeX,
  CircleDashed,
  Clock,
  Clock10,
  OctagonMinus,
} from "lucide-react";

export const columnsRentalsHistory: ColumnDef<
  z.infer<typeof rentalsHistorySchema>
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
    accessorKey: "rent_unit",
    header: "Dia / Evento",
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
    accessorKey: "expectedReturnDate",
    header: "Fecha de retorno",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "actualReturnDate",
    header: "Fecha de entrega",
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
            {type === "en_curso" ? (
              <CircleDashed />
            ) : type === "devuelto" ? (
              <BadgeCheck />
            ) : type === "atrasado" ? (
              <Clock10 />
            ) : type === "con_daños" ? (
              <OctagonMinus />
            ) : type === "perdido" ? (
              <BadgeX />
            ) : null}
            {type.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "gurantee",
    header: "Garantia",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "guarantee_status",
    header: "Estado de garantia",
    cell: ({ getValue }) => (
      <div className="w-32">
        {
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {getValue<string>().replace("_", " ").toUpperCase()}
          </Badge>
        }
      </div>
    ),
  },
  {
    accessorKey: "damage",
    header: "Daño",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    id: "actions",
    cell: () => <ActionCell />,
  },
];

function ActionCell() {
  return (
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
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Make a copy</DropdownMenuItem>
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
