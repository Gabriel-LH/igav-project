"use client";
import z from "zod";
import {
  IconChevronDown,
  IconLayoutColumns,
  IconSearch,
} from "@tabler/icons-react";

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
import { Input } from "@/components/input";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type Row,
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
  const [globalFilter, setGlobalFilter] = React.useState("");
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
    status: "Estado",
    outDate: "Fecha de salida",
    createdAt: "Fecha de registro",
    expectedReturnDate: "Fecha de devolución",
    saleDate: "Fecha de venta",
    returnDate: "Fecha de retorno",
    cancelDate: "Fecha de cancelación",
    branchName: "Sucursal",
    sellerName: "Vendedor",
  };

  const getCommonTableProps = <TData,>() => ({
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (
      row: Row<TData>,
      columnId: string,
      filterValue: string,
    ) => {
      const searchContent = (row.original as any).searchContent as string;
      return searchContent?.toLowerCase().includes(filterValue.toLowerCase());
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel<TData>(),
    getFilteredRowModel: getFilteredRowModel<TData>(),
    getPaginationRowModel: getPaginationRowModel<TData>(),
    getSortedRowModel: getSortedRowModel<TData>(),
    getFacetedRowModel: getFacetedRowModel<TData>(),
    getFacetedUniqueValues: getFacetedUniqueValues<TData>(),
  });

  const tableSalesPending = useReactTable<z.infer<typeof salesPendingSchema>>({
    data: dataSalesPending,
    columns: columnsSalesPending,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof salesPendingSchema>>(),
  });

  const tableSalesCanceled = useReactTable<z.infer<typeof salesCanceledSchema>>(
    {
      data: dataSalesCanceled,
      columns: columnsSalesCanceled,
      getRowId: (row) => row.id.toString(),
      ...getCommonTableProps<z.infer<typeof salesCanceledSchema>>(),
    },
  );

  const tableSalesReturn = useReactTable<z.infer<typeof salesReturnSchema>>({
    data: dataSalesReturn,
    columns: columnsSalesReturn,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof salesReturnSchema>>(),
  });

  const tableSalesHistory = useReactTable<z.infer<typeof salesHistorySchema>>({
    data: dataSalesHistory,
    columns: columnsSalesHistory,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof salesHistorySchema>>(),
  });

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex flex-col gap-4">
        {/* BUSCADOR Y COLUMNAS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, Cliente, DNI, Producto, Serie o Variante..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 h-10 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline text-xs">Columnas</span>
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
                      column.getCanHide() &&
                      column.id !== "searchContent",
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
                        {COLUMN_LABELS_ES[column.id] ?? column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* TABS SELECTORES */}
        <div className="flex items-center justify-between">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="flex w-fit lg:hidden" size="sm">
              <SelectValue placeholder="Seleccionar vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="history">Historial</SelectItem>
              <SelectItem value="canceled">Anulados</SelectItem>
              <SelectItem value="return">Devoluciones</SelectItem>
            </SelectContent>
          </Select>

          <TabsList className="hidden lg:flex">
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="canceled">Anulados</TabsTrigger>
            <TabsTrigger value="return">Devoluciones</TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent
        value="pending"
        className="relative flex flex-col gap-4 overflow-auto pt-4"
      >
        <SalesPendingTable data={dataSalesPending} table={tableSalesPending} />
      </TabsContent>

      <TabsContent value="canceled" className="pt-4">
        <SalesCanceledTable
          data={dataSalesCanceled}
          table={tableSalesCanceled}
        />
      </TabsContent>

      <TabsContent value="return" className="pt-4">
        <SalesReturnTable data={dataSalesReturn} table={tableSalesReturn} />
      </TabsContent>

      <TabsContent value="history" className="w-full pt-4">
        <SalesHistoryTable data={dataSalesHistory} table={tableSalesHistory} />
      </TabsContent>
    </Tabs>
  );
}
