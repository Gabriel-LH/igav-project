"use client";

import { IconDotsVertical } from "@tabler/icons-react";
import { type ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { DragHandle } from "../ui/DragHandle";
import { tradingSchema } from "../type.trading";
import { TableCellViewerTrading } from "./table-cell-viewer";

export const columnsTrading: ColumnDef<z.infer<typeof tradingSchema>>[] = [
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
    accessorKey: "item",
    header: "Item",
    cell: ({ row }) => {
      return <TableCellViewerTrading item={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "lastweek",
    header: "Semana pasada",
    cell: ({ row }) => <div className="w-32">{row.original.lastweek}</div>,
  },
  {
    accessorKey: "thisweek",
    header: "Semana actual",
    cell: ({ row }) => <div className="w-32">{row.original.thisweek}</div>,
  },
  {
    accessorKey: "difference",
    header: "Diferencia",
    cell: ({ row }) => <div className="w-32">{row.original.difference}</div>,
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
