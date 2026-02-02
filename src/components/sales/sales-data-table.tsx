"use client";
"use no memo";
import z from "zod";
import { IconChevronDown, IconLayoutColumns } from "@tabler/icons-react";

import { Button } from "@/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import React from "react";
import { columnsSalesPending } from "./tables/pending-sales/column-pending-table"; 
import { columnsSalesCanceled } from "./tables/canceled-sales/column-cancel-table"; 
import { columnsSalesReturn } from "./tables/return-sales/column-return-table"; 
import { columnsSalesHistory } from "./tables/history-sales/column-history-table"; 
import { salesPendingSchema } from "./tables/type/type.pending";
import { salesCanceledSchema } from "./tables/type/type.canceled";
import { salesReturnSchema } from "./tables/type/type.return";
import { salesHistorySchema } from "./tables/type/type.history";
import { SalesPendingTable } from "./tables/pending-sales/sales-pending-table";
import { SalesCanceledTable } from "./tables/canceled-sales/sales-canceled-table";
import { SalesReturnTable } from "./tables/return-sales/sales-return-table";
import { SalesHistoryTable } from "./tables/history-sales/sales-history-table";

export function SalesDataTable({
  dataSalesPending,
  dataSalesCanceled,
  dataSalesReturn,
  dataSalesHistory,
}: {
  dataSalesPending: z.infer<typeof salesPendingSchema>[];
  dataSalesCanceled: z.infer<typeof salesCanceledSchema>[];
  dataSalesReturn: z.infer<typeof salesReturnSchema>[];
  dataSalesHistory: z.infer<typeof salesHistorySchema>[];
}) {
  const [activeTab, setActiveTab] = React.useState("pending");
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const COLUMN_LABELS_ES: Record<string, string> = {
    nameCustomer: "Cliente",
    product: "Producto",
    rent_unit: "Evento / Día",
    count: "Cantidad",
    income: "Ingreso",
    gurantee: "Garantía",
    status: "Estado",
    outDate: "Fecha de salida",
    registerDate: "Fecha de registro",
    expectedReturnDate: "Fecha de devolución",
    returnDate: "Fecha de retorno",
    cancelDate: "Fecha de cancelación",
    branchName: "Sucursal",
    sellerName: "Vendedor",
    guarantee_status: "Estado de garantía",
  };

  // eslint-disable-next-line
  const tableSalesPending = useReactTable({
    data: dataSalesPending,
    columns: columnsSalesPending,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const tableSalesCanceled = useReactTable({
    data: dataSalesCanceled,
    columns: columnsSalesCanceled,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const tableSalesReturn = useReactTable({
    data: dataSalesReturn,
    columns: columnsSalesReturn,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

   const tableSalesHistory = useReactTable({
    data: dataSalesHistory,
    columns: columnsSalesHistory,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <Tabs
      value={activeTab} // Controlado por el estado
      onValueChange={setActiveTab} // Función para cambiar el estado
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between">
        {/* SELECT (Se ve en pantallas pequeñas @4xl/main:hidden) */}
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="flex w-fit lg:hidden" size="sm">
            <SelectValue placeholder="Seleccionar vista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="canceled">Anulados</SelectItem>
            <SelectItem value="return">Devoluciones</SelectItem>
            <SelectItem value="history">Historial</SelectItem>
          </SelectContent>
        </Select>

        {/* TABS (Se ve en pantallas grandes lg:flex) */}
        <TabsList className="hidden lg:flex">
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="canceled">Anulados</TabsTrigger>
          <TabsTrigger value="return">Devoluciones</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Personalizar Columnas</span>
                <span className="lg:hidden">Columnas</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {(activeTab === "pending"
                ? tableSalesPending
                : activeTab === "canceled"
                  ? tableSalesCanceled
                  : activeTab === "return"
                    ? tableSalesReturn
                    : tableSalesHistory
              )
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide(),
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {/* Aquí puedes usar un switch o mapeo si quieres nombres más amigables que el ID */}
                      {COLUMN_LABELS_ES[column.id] ?? column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* CONTENIDOS: Los "value" deben coincidir con los de arriba */}
      <TabsContent
        value="pending"
        className="relative flex flex-col gap-4 overflow-auto"
      >
        <SalesPendingTable data={dataSalesPending} table={tableSalesPending} />
      </TabsContent>

      <TabsContent value="canceled">
        <SalesCanceledTable
          data={dataSalesCanceled}
          table={tableSalesCanceled}
        />
      </TabsContent>

      <TabsContent value="return">
        <SalesReturnTable
          data={dataSalesReturn}
          table={tableSalesReturn}
        />
      </TabsContent>

      <TabsContent value="history" className="w-full">
        <SalesHistoryTable
          data={dataSalesHistory}
          table={tableSalesHistory}
        />
      </TabsContent>
    </Tabs>
  );
}
