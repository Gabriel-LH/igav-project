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
import { RentalsActiveTable } from "./data-table/rentals-active/rentals-active-table";
import { rentalsActiveSchema } from "./data-table/type/type.active";
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
import { columnsRentalsActive } from "./data-table/rentals-active/column-active-table";
import { columnsRentalCanceled } from "./data-table/canceled-rentals/column-cancel-table";
import { columnsRentalsHistory } from "./data-table/rentals-history/column-history-table";
import { rentalsCanceledSchema } from "./data-table/type/type.canceled";
import { rentalsHistorySchema } from "./data-table/type/type.history";
import { RentalsCanceledTable } from "./data-table/canceled-rentals/rental-canceled-table";
import { RentalsHistoryTable } from "./data-table/rentals-history/rentals-history-table";

export function RentalsDataTable({
  dataRentalActive,
  dataRentalCanceled,
  dataRentalHistory,
}: {
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
    expectedReturnDate: "Fecha de devolución",
    returnDate: "Fecha de retorno",
    cancelDate: "Fecha de cancelación",
    branchName: "Sucursal",
    sellerName: "Vendedor",
    guarantee_status: "Estado de garantía",
  };

  // eslint-disable-next-line
  const tableRentalActive = useReactTable({
    data: dataRentalActive,
    columns: columnsRentalsActive,
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

  const tableRentalCanceled = useReactTable({
    data: dataRentalCanceled,
    columns: columnsRentalCanceled,
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

  const tableRentalHistory = useReactTable({
    data: dataRentalHistory,
    columns: columnsRentalsHistory,
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
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="canceled">Anulados</SelectItem>
            <SelectItem value="history">Historial</SelectItem>
          </SelectContent>
        </Select>

        {/* TABS (Se ve en pantallas grandes lg:flex) */}
        <TabsList className="hidden lg:flex">
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="canceled">Anulados</TabsTrigger>
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
              {(activeTab === "active"
                ? tableRentalActive
                : activeTab === "canceled"
                  ? tableRentalCanceled
                  : tableRentalHistory
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
        value="active"
        className="relative flex flex-col gap-4 overflow-auto"
      >
        <RentalsActiveTable data={dataRentalActive} table={tableRentalActive} />
      </TabsContent>

      <TabsContent value="canceled">
        <RentalsCanceledTable
          data={dataRentalCanceled}
          table={tableRentalCanceled}
        />
      </TabsContent>

      <TabsContent value="history" className="w-full">
        <RentalsHistoryTable
          data={dataRentalHistory}
          table={tableRentalHistory}
        />
      </TabsContent>
    </Tabs>
  );
}
