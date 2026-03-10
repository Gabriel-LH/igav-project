// src/components/billing/features/FeaturesTable.tsx
import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { PlanFeature } from "@/src/types/plan/planFeature";
import { Plan } from "@/src/types/plan/planSchema";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";

interface FeaturesTableProps {
  features: PlanFeature[];
  plans: Plan[];
}

export const FeaturesTable: React.FC<FeaturesTableProps> = ({
  features,
  plans,
}) => {
  const columns: ColumnDef<PlanFeature>[] = [
    {
      accessorKey: "featureKey",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Feature
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {row.original.featureKey.replace(/([A-Z])/g, " $1").trim()}
        </div>
      ),
    },
    {
      id: "plan",
      header: "Plan",
      cell: ({ row }) => {
        const plan = plans.find((p) => p.id === row.original.planId);
        return <div>{plan?.name || "N/A"}</div>;
      },
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => {
        const plan = plans.find((p) => p.id === row.original.planId);
        return (
          <Badge 
            variant={plan?.isActive ? "default" : "secondary"}
            className={plan?.isActive ? "bg-green-500 text-white hover:bg-green-600" : ""}
          >
            {plan?.isActive ? "Activo" : "Inactivo"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: features,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
