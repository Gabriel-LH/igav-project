// components/cash/sessions-table.tsx
"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, MoreHorizontal, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomDropdown } from "../ui/custom/CustomDropdown";
import { CustomSelect } from "../ui/custom/CustomSelect";
import { Badge } from "@/components/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";
import { CashSessionTableRow } from "@/src/adapters/cash-session-adapter";
import { formatCurrency } from "@/src/utils/currency-format";

interface SessionsTableProps {
  data: CashSessionTableRow[];
  onViewSession: (session: CashSessionTableRow) => void;
  onCloseSession?: (session: CashSessionTableRow) => void;
}

export function SessionsTable({
  data,
  onViewSession,
  onCloseSession,
}: SessionsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredData = data.filter((session) => {
    if (statusFilter === "all") return true;
    return session.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    if (status === "open") {
      return <Badge className="bg-green-500 hover:bg-green-600">Abierta</Badge>;
    }
    return <Badge variant="secondary">Cerrada</Badge>;
  };

  const columns: ColumnDef<CashSessionTableRow>[] = [
    {
      accessorKey: "sessionNumber",
      header: "Sesión",
      cell: ({ row }) => (
        <div className="font-mono text-sm font-medium">
          {row.getValue("sessionNumber")}
        </div>
      ),
    },
    {
      accessorKey: "branchName",
      header: "Sucursal",
    },
    {
      accessorKey: "cashierName",
      header: "Cajero",
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "openedAt",
      header: "Apertura",
      cell: ({ row }) =>
        format(row.getValue("openedAt"), "dd/MM/yyyy HH:mm", { locale: es }),
    },
    {
      accessorKey: "closedAt",
      header: "Cierre",
      cell: ({ row }) => {
        const closedAt = row.getValue("closedAt");
        return closedAt
          ? format(closedAt as Date, "dd/MM/yyyy HH:mm", { locale: es })
          : "—";
      },
    },
    {
      accessorKey: "openingAmount",
      header: "Efectivo inicial",
      cell: ({ row }) => formatCurrency(row.getValue("openingAmount")),
    },
    {
      accessorKey: "difference",
      header: "Diferencia",
      cell: ({ row }) => {
        const diff = row.original.difference;
        if (diff === null) return "—";

        return (
          <span className={row.original.differenceColor}>
            {row.original.formattedDifference}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const session = row.original;
        const isOpen = session.status === "open";

        return (
          <CustomDropdown
            align="right"
            trigger={
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          >
            <div className="flex flex-col">
              <div className="px-2 py-1.5 text-sm font-semibold">Acciones</div>
              <button
                onClick={() => onViewSession(session)}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground border-none bg-transparent w-full text-left"
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </button>
              {isOpen && onCloseSession && (
                <button
                  onClick={() => onCloseSession(session)}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground border-none bg-transparent w-full text-left text-red-600"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </button>
              )}
              <div className="h-px bg-muted my-1" />
              <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground border-none bg-transparent w-full text-left">
                <Download className="mr-2 h-4 w-4" />
                Exportar reporte
              </button>
            </div>
          </CustomDropdown>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por sesión, sucursal o cajero..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 max-w-sm"
            />
          </div>
          <div className="w-[180px]">
            <CustomSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="Filtrar por estado"
              options={[
                { label: "Todas", value: "all" },
                { label: "Abiertas", value: "open" },
                { label: "Cerradas", value: "closed" },
              ]}
            />
          </div>
        </div>

        <div className="rounded-md border">
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
                    No hay sesiones
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
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
