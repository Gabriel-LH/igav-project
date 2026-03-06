"use client"

// src/components/dashboard/RecentActivityTable.tsx
import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  Building2,
  RefreshCw,
  XCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";

interface Activity {
  id: string;
  type:
    | "tenant_created"
    | "plan_updated"
    | "subscription_canceled"
    | "payment_received";
  description: string;
  tenantName: string;
  timestamp: Date;
}

interface RecentActivityTableProps {
  activities: Activity[];
}

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "tenant_created":
      return <Building2 className="h-4 w-4" />;
    case "plan_updated":
      return <RefreshCw className="h-4 w-4" />;
    case "subscription_canceled":
      return <XCircle className="h-4 w-4" />;
    case "payment_received":
      return <DollarSign className="h-4 w-4" />;
  }
};

const getActivityBadge = (type: Activity["type"]) => {
  switch (type) {
    case "tenant_created":
      return <Badge variant="outline">Nuevo Tenant</Badge>;
    case "plan_updated":
      return <Badge variant="default">Plan Actualizado</Badge>;
    case "subscription_canceled":
      return <Badge variant="destructive">Cancelación</Badge>;
    case "payment_received":
      return <Badge variant="outline">Pago</Badge>;
  }
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) {
    return "Hace unos minutos";
  } else if (hours < 24) {
    return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  } else if (days < 7) {
    return `Hace ${days} ${days === 1 ? "día" : "días"}`;
  }
  return date.toLocaleDateString();
};

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({
  activities,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Activity>[] = [
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-muted p-1.5">
            {getActivityIcon(row.original.type)}
          </div>
          {getActivityBadge(row.original.type)}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.description}</div>
      ),
    },
    {
      accessorKey: "tenantName",
      header: "Tenant",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.tenantName}</div>
      ),
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Fecha
            <ChevronLeft className="ml-2 h-4 w-4 rotate-90" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatTimestamp(row.original.timestamp)}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: activities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No hay actividades recientes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
