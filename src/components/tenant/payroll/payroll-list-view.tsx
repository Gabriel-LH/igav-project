"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  Eye,
  CheckCircle,
  Download,
  MoreHorizontal,
  Filter,
  Calendar,
  HandCoins,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/badge";

import { PayrollDetailModal } from "./ui/modal/PayrollDetailModal";
import type { PayrollItem } from "@/src/types/payroll/type.payrollItem";
import type { PayrollRun } from "@/src/types/payroll/type.payrollRun";
import type { PayrollLineItem } from "@/src/types/payroll/type.payrollLineItem";
import {
  getPayrollMemberName,
  type PayrollItemDetailDTO,
  type PayrollItemListItemDTO,
} from "@/src/application/interfaces/payroll/PayrollPresentation";

interface PayrollListViewProps {
  payrolls: PayrollItem[];
  runs: PayrollRun[];
  lineItems: PayrollLineItem[];
  onPayrollsChange: (payrolls: PayrollItem[]) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getStatusBadge(status: PayrollItem["status"]) {
  if (status === "paid") {
    return (
      <Badge className="gap-1 bg-green-600 hover:bg-green-700">
        <HandCoins className="h-3 w-3" />
        Pagado
      </Badge>
    );
  }
  if (status === "calculated") {
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Calculado
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <FileText className="h-3 w-3" />
      Borrador
    </Badge>
  );
}

export function PayrollListView({
  payrolls,
  runs,
  lineItems,
  onPayrollsChange,
}: PayrollListViewProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollItemDetailDTO | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  const runById = useMemo(() => {
    const map = new Map<string, PayrollRun>();
    runs.forEach((run) => map.set(run.id, run));
    return map;
  }, [runs]);

  const detailRows = useMemo<PayrollItemDetailDTO[]>(
    () =>
      payrolls
        .map((item) => {
          const run = runById.get(item.payrollRunId);
          if (!run) return null;

          const monthLabel = run.periodStart.toLocaleString("es-PE", { month: "short" });
          const periodLabel = `${monthLabel} ${run.periodStart.getFullYear()}`;

          return {
            id: item.id,
            payrollRunId: item.payrollRunId,
            membershipId: item.membershipId,
            employeeName: getPayrollMemberName(item.membershipId),
            periodLabel,
            payDate: run.payDate,
            status: item.status,
            grossTotal: item.grossTotal,
            deductionTotal: item.deductionTotal,
            netTotal: item.netTotal,
            periodStart: run.periodStart,
            periodEnd: run.periodEnd,
            lineItems: lineItems.filter((line) => line.payrollItemId === item.id),
          };
        })
        .filter((value): value is PayrollItemDetailDTO => value !== null),
    [lineItems, payrolls, runById],
  );

  const filteredData = useMemo<PayrollItemListItemDTO[]>(() => {
    const query = globalFilter.toLowerCase().trim();

    return detailRows.filter((row) => {
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return (
        row.employeeName.toLowerCase().includes(query) ||
        row.membershipId.toLowerCase().includes(query)
      );
    });
  }, [detailRows, globalFilter, statusFilter]);

  const markAsPaid = useCallback((itemId: string) => {
    onPayrollsChange(
      payrolls.map((payroll) =>
        payroll.id === itemId ? { ...payroll, status: "paid" } : payroll,
      ),
    );
  }, [onPayrollsChange, payrolls]);

  const columns = useMemo<ColumnDef<PayrollItemListItemDTO>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: "Empleado",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.employeeName}</p>
            <p className="text-xs text-muted-foreground">{row.original.membershipId}</p>
          </div>
        ),
      },
      {
        accessorKey: "periodLabel",
        header: "Periodo",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {row.original.periodLabel}
          </div>
        ),
      },
      {
        accessorKey: "grossTotal",
        header: "Bruto",
        cell: ({ row }) => formatCurrency(row.original.grossTotal),
      },
      {
        accessorKey: "deductionTotal",
        header: "Descuentos",
        cell: ({ row }) => formatCurrency(row.original.deductionTotal),
      },
      {
        accessorKey: "netTotal",
        header: "Neto",
        cell: ({ row }) => (
          <span className="font-semibold text-primary">
            {formatCurrency(row.original.netTotal)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const payroll = row.original;
          const detail = detailRows.find((item) => item.id === payroll.id);

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    if (!detail) return;
                    setSelectedPayroll(detail);
                    setShowDetailModal(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalle
                </DropdownMenuItem>

                {payroll.status !== "paid" && (
                  <DropdownMenuItem onClick={() => markAsPaid(payroll.id)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como pagado
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log("Exportar PDF", payroll.id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("Exportar Excel", payroll.id)}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [detailRows, markAsPaid],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <div>
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empleado o membership..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="calculated">Calculado</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No hay planillas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {showDetailModal && selectedPayroll && (
        <PayrollDetailModal
          payroll={selectedPayroll}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPayroll(null);
          }}
          onMarkPaid={() => markAsPaid(selectedPayroll.id)}
        />
      )}
    </>
  );
}
