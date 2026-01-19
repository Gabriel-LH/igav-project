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
import { DragHandle } from "../../ui/DragHandle";
import { popularSchema } from "../../type.popular";
import { TableCellViewerPopular } from "./table-cell-viewer";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RepeatIcon,
  SaleTag02Icon,
} from "@hugeicons/core-free-icons";

export const columnsPopular: ColumnDef<z.infer<typeof popularSchema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
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
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      return <TableCellViewerPopular item={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.type === "Venta" ? (
            <HugeiconsIcon
              icon={SaleTag02Icon}
              strokeWidth={2.2}
              className="text-green-500 dark:text-green-400"
            />
          ) : (
            <HugeiconsIcon
              icon={RepeatIcon}
              strokeWidth={2.2}
              className="text-green-500 dark:text-green-400"
            />
          )}
          {row.original.type}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "count",
    header: "Cantidad de veces",
    cell: ({ row }) => <div className="w-32">{row.original.count}</div>,
  },
  {
    accessorKey: "income",
    header: "Ingreso generado",
    cell: ({ row }) => <div className="w-32">S/. {row.original.income}</div>,
  },
  {
    id: "actions",
    cell: () => (
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
    ),
  },
];
