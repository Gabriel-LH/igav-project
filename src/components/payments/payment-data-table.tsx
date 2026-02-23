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
import { PaymentDatePreset } from "./payment-layout";
import { columnsPaymentsUnified } from "./tables/columns";
import { PaymentTable } from "./tables/payment-table";
import { paymentTableSchema } from "./type/type.payments";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

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
          <Select
            value={datePreset}
            onValueChange={(value) =>
              onDatePresetChange(value as PaymentDatePreset)
            }
          >
            <SelectTrigger className="h-10 w-[220px]">
              <SelectValue placeholder="Filtrar por fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="yesterday">Ayer</SelectItem>
              <SelectItem value="days_2">Hace 2 dias</SelectItem>
              <SelectItem value="days_3">Hace 3 dias</SelectItem>
              <SelectItem value="days_4">Hace 4 dias</SelectItem>
              <SelectItem value="days_5">Hace 5 dias</SelectItem>
              <SelectItem value="days_6">Hace 6 dias</SelectItem>
              <SelectItem value="days_7">Hace 7 dias</SelectItem>
              <SelectItem value="custom">Rango personalizado</SelectItem>
            </SelectContent>
          </Select>

          {datePreset === "custom" ? (
            <>
              <Field className="-mt-3 w-60">
                <FieldLabel htmlFor="date-picker-range"></FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date-picker-range"
                      className="justify-start px-2.5 font-normal"
                    >
                      <CalendarIcon />
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
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                  </PopoverContent>
                </Popover>
              </Field>
            </>
          ) : null}

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
