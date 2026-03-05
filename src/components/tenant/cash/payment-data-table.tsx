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
import { CustomDropdown, CustomPopover } from "./ui/custom/CustomDropdown";
import { Input } from "@/components/input";
import { CustomSelect } from "./ui/custom/CustomSelect";
import type { PaymentDatePreset } from "@/src/utils/cash/cashPayment";
import { columnsPaymentsUnified } from "./tables/columns";
import { PaymentTable } from "./tables/payment-table";
import { paymentTableSchema } from "./type/type.payments";
import { Field, FieldLabel } from "@/components/ui/field";
import { CalendarIcon, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

type PaymentRow = z.infer<typeof paymentTableSchema>;

export function PaymentDataTable({
  data,
  datePreset,
  onDatePresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: {
  data: PaymentRow[];
  datePreset: PaymentDatePreset;
  onDatePresetChange: (value: PaymentDatePreset) => void;
  customFrom: Date;
  customTo: Date;
  onCustomFromChange: (value: Date) => void;
  onCustomToChange: (value: Date) => void;
}) {
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
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: customFrom,
    to: customTo,
  });

  const COLUMN_LABELS_ES: Record<string, string> = {
    clientName: "Cliente",
    operationType: "Operacion",
    receivedBy: "Registrado por",
    amount: "Movimiento",
    category: "Categoria",
    status: "Estado",
    date: "Fecha",
    method: "Metodo",
    reference: "Referencia",
    notes: "Notas",
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<PaymentRow>({
    data,
    columns: columnsPaymentsUnified,
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

      const searchableText = [
        row.original.clientName,
        row.original.method,
        row.original.status,
        row.original.category,
      ]
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

  const presetOptions = [
    { label: "Hoy", value: "today" },
    { label: "Ayer", value: "yesterday" },
    { label: "Hace 2 dias", value: "days_2" },
    { label: "Hace 3 dias", value: "days_3" },
    { label: "Hace 4 dias", value: "days_4" },
    { label: "Hace 5 dias", value: "days_5" },
    { label: "Hace 6 dias", value: "days_6" },
    { label: "Hace 7 dias", value: "days_7" },
    { label: "Rango personalizado", value: "custom" },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, metodo, estado o categoria"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-[220px]">
            <CustomSelect
              value={datePreset}
              onValueChange={(value) =>
                onDatePresetChange(value as PaymentDatePreset)
              }
              options={presetOptions}
              placeholder="Filtrar por fecha"
            />
          </div>

          {datePreset === "custom" ? (
            <>
              <Field className="-mt-3 w-60">
                <FieldLabel htmlFor="date-picker-range"></FieldLabel>
                <CustomPopover
                  trigger={
                    <Button
                      variant="outline"
                      id="date-picker-range"
                      className="justify-start px-2.5 font-normal"
                    >
                      <CalendarIcon className="mr-2" />
                      {customFrom ? (
                        customTo ? (
                          <>
                            {format(customFrom, "LLL dd, y")} -{" "}
                            {format(customTo, "LLL dd, y")}
                          </>
                        ) : (
                          format(customFrom, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  }
                >
                  <Calendar
                    mode="range"
                    defaultMonth={customFrom}
                    selected={date}
                    onSelect={(range) => {
                      setDate(range); // mantiene el estado local del calendario
                      if (range?.from) onCustomFromChange(range.from);
                      if (range?.to) onCustomToChange(range.to);
                    }}
                    numberOfMonths={2}
                  />
                </CustomPopover>
              </Field>
            </>
          ) : null}

          <CustomDropdown
            align="right"
            trigger={
              <Button variant="outline" size="sm" className="h-10 gap-2">
                <IconLayoutColumns className="size-4" />
                <span className="hidden xl:inline text-xs">Columnas</span>
                <IconChevronDown className="size-4" />
              </Button>
            }
          >
            <div className="flex flex-col w-56 p-1">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    column.getCanHide() &&
                    !["drag", "select", "actions"].includes(column.id),
                )
                .map((column) => (
                  <button
                    key={column.id}
                    onClick={(e) => {
                      e.stopPropagation(); // Avoid closing the dropdown when toggling visibility
                      column.toggleVisibility(!column.getIsVisible());
                    }}
                    className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left w-full bg-transparent border-none capitalize"
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {column.getIsVisible() && <Check className="h-4 w-4" />}
                    </span>
                    {COLUMN_LABELS_ES[column.id] ?? column.id}
                  </button>
                ))}
            </div>
          </CustomDropdown>
        </div>
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto pt-3">
        <PaymentTable
          data={data}
          table={table}
          columnCount={columnsPaymentsUnified.length}
        />
      </div>
    </div>
  );
}
