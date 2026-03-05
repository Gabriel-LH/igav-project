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
import { RentalsActiveTable } from "./tables/rentals-active/rentals-active-table";
import { rentalsActiveSchema } from "./tables/type/type.active";
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
import { columnsRentalsActive } from "./tables/rentals-active/column-active-table";
import { columnsRentalCanceled } from "./tables/canceled-rentals/column-cancel-table";
import { columnsRentalsHistory } from "./tables/rentals-history/column-history-table";
import { rentalsCanceledSchema } from "./tables/type/type.canceled";
import { rentalsHistorySchema } from "./tables/type/type.history";
import { RentalsCanceledTable } from "./tables/canceled-rentals/rental-canceled-table";
import { RentalsHistoryTable } from "./tables/rentals-history/rentals-history-table";
import { rentalsPendingSchema } from "./tables/type/type.pending";
import { columnsRentalsPending } from "./tables/pending-rentals/column-pending-table";
import { RentalsPendingTable } from "./tables/pending-rentals/rentals-pending-table";

export function RentalsDataTable({
  dataRentalPending,
  dataRentalActive,
  dataRentalCanceled,
  dataRentalHistory,
}: {
  dataRentalPending: z.infer<typeof rentalsPendingSchema>[];
  dataRentalActive: z.infer<typeof rentalsActiveSchema>[];
  dataRentalCanceled: z.infer<typeof rentalsCanceledSchema>[];
  dataRentalHistory: z.infer<typeof rentalsHistorySchema>[];
}) {
  const [activeTab, setActiveTab] = React.useState("active");
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
    gurantee_type: "Garantía",
    status: "Estado",
    outDate: "Fecha de salida",
    expectedReturnDate: "Fecha de devolución",
    returnDate: "Fecha de retorno",
    cancelDate: "Fecha de cancelación",
    branchName: "Sucursal",
    sellerName: "Vendedor",
    guarantee_status: "Estado de garantía",
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

  const tableRentalActive = useReactTable<z.infer<typeof rentalsActiveSchema>>({
    data: dataRentalActive,
    columns: columnsRentalsActive,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof rentalsActiveSchema>>(),
  });

  const tableRentalPending = useReactTable<
    z.infer<typeof rentalsPendingSchema>
  >({
    data: dataRentalPending,
    columns: columnsRentalsPending,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof rentalsPendingSchema>>(),
  });

  const tableRentalCanceled = useReactTable<
    z.infer<typeof rentalsCanceledSchema>
  >({
    data: dataRentalCanceled,
    columns: columnsRentalCanceled,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof rentalsCanceledSchema>>(),
  });

  const tableRentalHistory = useReactTable<
    z.infer<typeof rentalsHistorySchema>
  >({
    data: dataRentalHistory,
    columns: columnsRentalsHistory,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof rentalsHistorySchema>>(),
  });

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start"
    >
      <div className="flex flex-col gap-4">
        <div className="relative w-full max-w-md md:w-96">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, Cliente, DNI, Producto, Serie o Variante..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 h-10 w-full"
          />
        </div>

        {/* TABS SELECTORES */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center justify-between">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="flex w-fit lg:hidden" size="sm">
                <SelectValue placeholder="Seleccionar vista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="canceled">Anulados</SelectItem>
                <SelectItem value="history">Historial</SelectItem>
              </SelectContent>
            </Select>

            <TabsList className="hidden lg:flex">
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="canceled">Anulados</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline text-xs">Columnas</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {(activeTab === "active"
                  ? tableRentalActive
                  : activeTab === "canceled"
                    ? tableRentalCanceled
                    : activeTab === "history"
                      ? tableRentalHistory
                      : tableRentalPending
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
      </div>

      <TabsContent
        value="active"
        className="relative flex flex-col gap-4 overflow-auto pt-3"
      >
        <RentalsActiveTable data={dataRentalActive} table={tableRentalActive} />
      </TabsContent>

      <TabsContent value="pending" className="w-full pt-4">
        <RentalsPendingTable
          data={dataRentalPending}
          table={tableRentalPending}
        />
      </TabsContent>

      <TabsContent value="canceled" className="pt-4">
        <RentalsCanceledTable
          data={dataRentalCanceled}
          table={tableRentalCanceled}
        />
      </TabsContent>

      <TabsContent value="history" className="w-full pt-4">
        <RentalsHistoryTable
          data={dataRentalHistory}
          table={tableRentalHistory}
        />
      </TabsContent>
    </Tabs>
  );
}
