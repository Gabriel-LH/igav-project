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
import { DragHandle } from "../ui/DragHandle";
import { clientSchema } from "../type";
import { TableCellViewer } from "./table-cell-viewer";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CancelCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";

export const columns: ColumnDef<z.infer<typeof clientSchema>>[] = [
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
      return <TableCellViewer item={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "operationsRent",
    header: "No. Operaciones alquiler",
    cell: ({ row }) => (
      <div className="w-32">{row.original.operationsRent}</div>
    ),
  },
  {
    accessorKey: "operationsBuy",
    header: "No. Operaciones compra",
    cell: ({ row }) => <div className="w-32">{row.original.operationsBuy}</div>,
  },
  {
    accessorKey: "totalRent",
    header: "Valor total alquiler",
    cell: ({ row }) => <div className="w-32">{row.original.totalRent}</div>,
  },
  {
    accessorKey: "totalBuy",
    header: "Valor total compra",
    cell: ({ row }) => <div className="w-32">{row.original.totalBuy}</div>,
  },
  {
    accessorKey: "lastOperation",
    header: "Ultima operacion",
    cell: ({ row }) => <div className="w-32">{row.original.lastOperation}</div>,
  },

  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === "Activo" ? (
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            strokeWidth={2.2}
            className="text-green-500 dark:text-green-400"
          />
        ) : (
          <HugeiconsIcon
            icon={CancelCircleIcon}
            strokeWidth={2.2}
            className="text-red-500 dark:text-red-400"
          />
        )}
        {row.original.status}
      </Badge>
    ),
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
