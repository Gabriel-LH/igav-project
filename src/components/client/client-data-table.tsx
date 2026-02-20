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
import { columnsClientActive } from "./tables/active-table/column-active-table";
import { columnsClientInactive } from "./tables/inactive-table/column-inactive-table";

import { clientActiveSchema } from "./tables/type/type.active";
import { clientInactiveSchema } from "./tables/type/type.inactive";

import { ClientsAllTable } from "./tables/active-table/active-client-table";
import { ClientsInactiveTable } from "./tables/inactive-table/inactive-client-table";
import { CreateClientModal } from "./ui/modals/CreateClientModal";
import { UserPlus2 } from "lucide-react";
import { clientAllSchema } from "./tables/type/type.all";
import { ClientsActiveTable } from "./tables/all-table/all-client-table";
import { columnsClientAll } from "./tables/all-table/column-active-table";

export function ClientDataTable({
  dataClientActive,
  dataClientInactive,
  dataClientAll,
}: {
  dataClientActive: z.infer<typeof clientActiveSchema>[];
  dataClientInactive: z.infer<typeof clientInactiveSchema>[];
  dataClientAll: z.infer<typeof clientAllSchema>[];
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

  const tableClientActive = useReactTable<z.infer<typeof clientActiveSchema>>({
    data: dataClientActive,
    columns: columnsClientActive,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof clientActiveSchema>>(),
  });

  const tableClientInactive = useReactTable<
    z.infer<typeof clientInactiveSchema>
  >({
    data: dataClientInactive,
    columns: columnsClientInactive,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof clientInactiveSchema>>(),
  });

  const tableClientAll = useReactTable<z.infer<typeof clientAllSchema>>({
    data: dataClientAll,
    columns: columnsClientAll,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof clientAllSchema>>(),
  });

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex flex-col"
    >
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        {/* Buscador */}
        <div className="relative w-full max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, Cliente, DNI"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Acciones + Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* IZQUIERDA */}
          <div className="flex items-center gap-2">
            {/* Mobile */}
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="lg:hidden w-fit" size="sm">
                <SelectValue placeholder="Seleccionar vista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>

            {/* Desktop */}
            <TabsList className="hidden lg:flex">
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="inactive">Inactivos</TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>
          </div>

          {/* DERECHA */}
          <div className="flex items-center gap-2 flex-wrap">
            <CreateClientModal>
              <Button size="sm" className="h-10 gap-2">
                <UserPlus2 className="size-4" />
                <span className="hidden xl:inline text-xs">Crear cliente</span>
              </Button>
            </CreateClientModal>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-2">
                  <IconLayoutColumns className="size-4" />
                  <span className="hidden xl:inline text-xs">Columnas</span>
                  <IconChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-56">
                {(activeTab === "active"
                  ? tableClientActive
                  : tableClientInactive
                )
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide() &&
                      column.id !== "searchContent",
                  )
                  .map((column) => (
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
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <TabsContent
        value="active"
        className="relative flex flex-col gap-4 overflow-auto pt-3"
      >
        <ClientsActiveTable data={dataClientActive} table={tableClientActive} />
      </TabsContent>

      <TabsContent value="inactive" className="w-full pt-4">
        <ClientsInactiveTable
          data={dataClientInactive}
          table={tableClientInactive}
        />
      </TabsContent>

      <TabsContent value="all" className="w-full pt-4">
        <ClientsAllTable data={dataClientAll} table={tableClientAll} />
      </TabsContent>
    </Tabs>
  );
}
