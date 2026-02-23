"use client";

import z from "zod";
import {
  IconChevronDown,
  IconLayoutColumns,
  IconSearch,
} from "@tabler/icons-react";
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

import { Button } from "@/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { Input } from "@/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { columnsPaymentCanceled } from "./tables/canceled-table/column-canceled-table";
import { columnsPaymentCompleted } from "./tables/completed-table/column-completed-table";
import { columnsPaymentPending } from "./tables/pending-table/column-pending-table";
import { columnsPaymentRefund } from "./tables/refund-table/column-refund-table";
import { PaymentTable } from "./tables/payment-table";
import { paymentTableSchema } from "./type/type.payments";

type PaymentRow = z.infer<typeof paymentTableSchema>;
type PaymentTab = "completed" | "pending" | "refund" | "corrections";

export function PaymentDataTable({
  dataPaymentCompleted,
  dataPaymentPending,
  dataPaymentRefund,
  dataPaymentCorrections,
}: {
  dataPaymentCompleted: PaymentRow[];
  dataPaymentPending: PaymentRow[];
  dataPaymentRefund: PaymentRow[];
  dataPaymentCorrections: PaymentRow[];
}) {
  const [activeTab, setActiveTab] = React.useState<PaymentTab>("completed");
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
    clientName: "Cliente",
    operationType: "Operacion",
    receivedBy: "Registrado por",
    totalAmount: "Total",
    amount: "Movimiento",
    netPaid: "Pagado neto",
    remaining: "Pendiente",
    category: "Categoria",
    status: "Estado",
    date: "Fecha",
    method: "Metodo",
    reference: "Referencia",
    notes: "Notas",
  };

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setRowSelection({});
  }, [activeTab]);

  const tableConfig = React.useMemo(() => {
    if (activeTab === "completed") {
      return {
        data: dataPaymentCompleted,
        columns: columnsPaymentCompleted,
      };
    }

    if (activeTab === "pending") {
      return {
        data: dataPaymentPending,
        columns: columnsPaymentPending,
      };
    }

    if (activeTab === "refund") {
      return {
        data: dataPaymentRefund,
        columns: columnsPaymentRefund,
      };
    }

    return {
      data: dataPaymentCorrections,
      columns: columnsPaymentCanceled,
    };
  }, [
    activeTab,
    dataPaymentCompleted,
    dataPaymentPending,
    dataPaymentRefund,
    dataPaymentCorrections,
  ]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<PaymentRow>({
    data: tableConfig.data,
    columns: tableConfig.columns,
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _, filterValue) => {
      const query = String(filterValue).toLowerCase().trim();
      if (!query) return true;

      const searchableText = Object.values(row.original)
        .map((value) => {
          if (value instanceof Date) return value.toLocaleDateString();
          return String(value ?? "");
        })
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    },
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

  const renderActiveTable = () => (
    <PaymentTable
      data={tableConfig.data}
      table={table}
      columnCount={tableConfig.columns.length}
    />
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as PaymentTab)}
      className="w-full flex flex-col"
    >
      <div className="flex flex-col gap-4">
        <div className="relative w-full max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, cliente, metodo o referencia"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as PaymentTab)}
            >
              <SelectTrigger className="lg:hidden w-fit" size="sm">
                <SelectValue placeholder="Seleccionar vista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="refund">Reembolsos</SelectItem>
                <SelectItem value="corrections">Correcciones</SelectItem>
              </SelectContent>
            </Select>

            <TabsList className="hidden lg:flex">
              <TabsTrigger value="completed">Completados</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="refund">Reembolsos</TabsTrigger>
              <TabsTrigger value="corrections">Correcciones</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-2">
                  <IconLayoutColumns className="size-4" />
                  <span className="hidden xl:inline text-xs">Columnas</span>
                  <IconChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      column.getCanHide() &&
                      !["drag", "select", "actions"].includes(column.id),
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
        {renderActiveTable()}
      </TabsContent>
      <TabsContent value="pending" className="w-full pt-4">
        {renderActiveTable()}
      </TabsContent>
      <TabsContent value="refund" className="w-full pt-4">
        {renderActiveTable()}
      </TabsContent>
      <TabsContent value="corrections" className="w-full pt-4">
        {renderActiveTable()}
      </TabsContent>
    </Tabs>
  );
}
