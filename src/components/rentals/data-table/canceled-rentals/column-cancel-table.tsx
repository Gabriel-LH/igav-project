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
import { TableCellViewerPopular } from "@/src/components/dashboard/data-table/most-popular/table-cell-viewer";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleDashed, RepeatIcon, SaleTag02Icon } from "@hugeicons/core-free-icons";
import { rentalsCanceledSchema } from "../type/type.canceled";
import { BadgeX } from "lucide-react";
import { TableCellViewerCanceled } from "./cancel-table-cell-viewer";

export const columnsRentalCanceled: ColumnDef<
  z.infer<typeof rentalsCanceledSchema>
>[] = [
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
     accessorKey: "nameCustomer",
     header: "Cliente",
     cell: ({ row }) => {
       return <TableCellViewerCanceled item={row.original} />;
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
     cell: ({ getValue }) => <div className="w-32">S/. {getValue<number>()}</div>,
   },
   {
     accessorKey: "outDate",
     header: "Fecha de registro",
     cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
   },
   {
     accessorKey: "cancelDate",
     header: "Fecha de anulacion",
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
             {type === "anulada" &&
               <BadgeX />
             }
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
