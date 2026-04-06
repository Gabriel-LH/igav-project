"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Eye, MoreHorizontal, Download, AlertCircle, Filter } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Badge } from "@/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { CustomSelect } from "./ui/custom/CustomSelect";
import { SessionTable } from "./tables/session-table";
import { formatCurrency } from "@/src/utils/currency-format";
import type { CashSessionTableRow } from "@/src/adapters/cash-session-adapter";

interface SessionDataTableProps {
  data: CashSessionTableRow[];
  onViewSession: (session: CashSessionTableRow) => void;
  onCloseSession?: (session: CashSessionTableRow) => void;
}

const STATUS_OPTIONS = [
  { label: "Todas", value: "all" },
  { label: "Abiertas", value: "open" },
  { label: "Cerradas", value: "closed" },
];

export function SessionDataTable({
  data,
  onViewSession,
  onCloseSession,
}: SessionDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const filteredData = React.useMemo(
    () =>
      data.filter((session) =>
        statusFilter === "all" ? true : session.status === statusFilter,
      ),
    [data, statusFilter],
  );

  const getStatusBadge = React.useCallback((status: CashSessionTableRow["status"]) => {
    if (status === "open") {
      return <Badge className="bg-green-500 hover:bg-green-600">Abierta</Badge>;
    }
    return <Badge variant="secondary">Cerrada</Badge>;
  }, []);

  const columns = React.useMemo<ColumnDef<CashSessionTableRow>[]>(
    () => [
      {
        accessorKey: "sessionNumber",
        header: "Sesion",
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
            : "-";
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
          if (diff === null) return "-";
          return (
            <span className={row.original.differenceColor}>
              {row.original.formattedDifference}
            </span>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const session = row.original;
          const isOpen = session.status === "open";

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onViewSession(session)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalle
                </DropdownMenuItem>
                {isOpen && onCloseSession && (
                  <DropdownMenuItem
                    onClick={() => onCloseSession(session)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Cerrar sesion
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar reporte
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [getStatusBadge, onCloseSession, onViewSession],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<CashSessionTableRow>({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _, filterValue) => {
      const query = String(filterValue).toLowerCase().trim();
      if (!query) return true;
      const searchable = [
        row.original.sessionNumber,
        row.original.branchName,
        row.original.cashierName,
        row.original.status,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por sesion, sucursal o cajero"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="w-full lg:w-[220px]">
          <CustomSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={STATUS_OPTIONS}
            placeholder="Filtrar por estado"
          />
        </div>
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto pt-3">
        <SessionTable table={table} columnCount={columns.length} />
      </div>
    </div>
  );
}
