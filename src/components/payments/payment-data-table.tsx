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
import { columnsPaymentCompleted } from "./tables/completed-table/column-completed-table";
import { columnsPaymentPending } from "./tables/pending-table/column-pending-table";
import { columnsPaymentRefund } from "./tables/refund-table/column-refund-table";
import { columnsPaymentCanceled } from "./tables/canceled-table/column-canceled-table";

import { paymentTableSchema } from "./type/type.payments";

import { PaymentCompletedTable } from "./tables/completed-table/completed-payment-table";
import { PaymentPendingTable } from "./tables/pending-table/pending-payment-table";
import { PaymentRefundTable } from "./tables/refund-table/refund-payment-table";
import { PaymentCanceledTable } from "./tables/canceled-table/canceled-payment-table";

export function PaymentDataTable({
  dataPaymentCompleted,
  dataPaymentPending,
  dataPaymentRefund,
  dataPaymentCanceled,
}: {
  dataPaymentCompleted: z.infer<typeof paymentTableSchema>[];
  dataPaymentPending: z.infer<typeof paymentTableSchema>[];
  dataPaymentRefund: z.infer<typeof paymentTableSchema>[];
  dataPaymentCanceled: z.infer<typeof paymentTableSchema>[];
}) {
  const [activeTab, setActiveTab] = React.useState("completed");
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

  const tablePaymentCompleted = useReactTable<
    z.infer<typeof paymentTableSchema>
  >({
    data: dataPaymentCompleted,
    columns: columnsPaymentCompleted,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof paymentTableSchema>>(),
  });

  const tablePaymentPending = useReactTable<z.infer<typeof paymentTableSchema>>(
    {
      data: dataPaymentPending,
      columns: columnsPaymentPending,
      getRowId: (row) => row.id.toString(),
      ...getCommonTableProps<z.infer<typeof paymentTableSchema>>(),
    },
  );

  const tablePaymentRefund = useReactTable<z.infer<typeof paymentTableSchema>>({
    data: dataPaymentRefund,
    columns: columnsPaymentRefund,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof paymentTableSchema>>(),
  });

  const tablePaymentCanceled = useReactTable<
    z.infer<typeof paymentTableSchema>
  >({
    data: dataPaymentCanceled,
    columns: columnsPaymentCanceled,
    getRowId: (row) => row.id.toString(),
    ...getCommonTableProps<z.infer<typeof paymentTableSchema>>(),
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
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="refund">Reembolsos</SelectItem>
                <SelectItem value="canceled">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            {/* Desktop */}
            <TabsList className="hidden lg:flex">
              <TabsTrigger value="completed">Completados</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="refund">Reembolsos</TabsTrigger>
              <TabsTrigger value="canceled">Cancelados</TabsTrigger>
            </TabsList>
          </div>

          {/* DERECHA */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* <CreatePaymentModal>
              <Button size="sm" className="h-10 gap-2">
                <UserPlus2 className="size-4" />
                <span className="hidden xl:inline text-xs">Crear pago</span>
              </Button>
            </CreatePaymentModal> */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-2">
                  <IconLayoutColumns className="size-4" />
                  <span className="hidden xl:inline text-xs">Columnas</span>
                  <IconChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-56">
                {(activeTab === "completed"
                  ? tablePaymentCompleted
                  : activeTab === "pending"
                    ? tablePaymentPending
                    : activeTab === "refund"
                      ? tablePaymentRefund
                      : tablePaymentCanceled
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
        value="completed"
        className="relative flex flex-col gap-4 overflow-auto pt-3"
      >
        <PaymentCompletedTable
          data={dataPaymentCompleted}
          table={tablePaymentCompleted}
        />
      </TabsContent>

      <TabsContent value="pending" className="w-full pt-4">
        <PaymentPendingTable
          data={dataPaymentPending}
          table={tablePaymentPending}
        />
      </TabsContent>

      <TabsContent value="refund" className="w-full pt-4">
        <PaymentRefundTable
          data={dataPaymentRefund}
          table={tablePaymentRefund}
        />
      </TabsContent>

      <TabsContent value="canceled" className="w-full pt-4">
        <PaymentCanceledTable
          data={dataPaymentCanceled}
          table={tablePaymentCanceled}
        />
      </TabsContent>
    </Tabs>
  );
}
