// components/payroll/PayrollListView.tsx
"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  Eye,
  RefreshCw,
  CheckCircle,
  FileText,
  Download,
  MoreHorizontal,
  Filter,
  Calendar,
  HandCoins,
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
import type { PayrollView } from "@/src/types/payroll/type.payrollView";

interface PayrollListViewProps {
  payrolls: PayrollView[];
  onPayrollsChange: (payrolls: PayrollView[]) => void;
}

export function PayrollListView({
  payrolls,
  onPayrollsChange,
}: PayrollListViewProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollView | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredData = useMemo(() => {
    return payrolls.filter((payroll) => {
      if (statusFilter === "all") return true;
      return payroll.status === statusFilter;
    });
  }, [payrolls, statusFilter]);

  const handleRecalculate = (payroll: PayrollView) => {
    // Simular recálculo
    const updatedPayroll: PayrollView = {
      ...payroll,
      status: "calculated",
      generatedAt: new Date(),
    };
    onPayrollsChange(
      payrolls.map((p) => (p.id === payroll.id ? updatedPayroll : p)),
    );
  };

  const handleMarkAsPaid = (payroll: PayrollView) => {
    const updatedPayroll: PayrollView = {
      ...payroll,
      status: "paid",
      paidAt: new Date(),
    };
    onPayrollsChange(
      payrolls.map((p) => (p.id === payroll.id ? updatedPayroll : p)),
    );
  };

  const handleExport = (payroll: PayrollView, format: "pdf" | "excel") => {
    console.log(`Exportando ${payroll.employeeName} a ${format}`);
    // Aquí iría la lógica de exportación
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: {
        variant: "secondary" as const,
        label: "Borrador",
        icon: <FileText className="mr-2 h-3 w-3" />,
        colorClass: "",
      },
      calculated: {
        variant: "default" as const,
        label: "Calculado",
        icon: <CheckCircle className="mr-2 h-3 w-3" />,
        colorClass: "",
      },
      paid: {
        variant: "default" as const,
        label: "Pagado",
        icon: <HandCoins className="mr-2 h-3 w-3" />,
        colorClass: "bg-green-600 hover:bg-green-700",
      },
    };
    const statusInfo =
      variants[status as keyof typeof variants] || variants.draft;

    return (
      <Badge
        variant={statusInfo.variant}
        className={`gap-1 ${statusInfo.colorClass}`}
      >
        <span>{statusInfo.icon}</span>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const columns: ColumnDef<PayrollView>[] = [
    {
      accessorKey: "employeeName",
      header: "Empleado",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("employeeName")}</div>
      ),
    },
    {
      id: "period",
      header: "Período",
      cell: ({ row }) => {
        const { month, year } = row.original.period;
        const monthNames = [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {monthNames[month - 1]} {year}
          </div>
        );
      },
    },
    {
      accessorKey: "calculations.baseAmount",
      header: "Base",
      cell: ({ row }) => formatCurrency(row.original.calculations.baseAmount),
    },
    {
      accessorKey: "calculations.overtimeAmount",
      header: "Extras",
      cell: ({ row }) =>
        formatCurrency(row.original.calculations.overtimeAmount),
    },
    {
      accessorKey: "calculations.deductions.total",
      header: "Descuentos",
      cell: ({ row }) =>
        formatCurrency(row.original.calculations.deductions.total),
    },
    {
      accessorKey: "calculations.total",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {formatCurrency(row.original.calculations.total)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const payroll = row.original;
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
                  setSelectedPayroll(payroll);
                  setShowDetailModal(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>

              {payroll.status !== "paid" && (
                <>
                  <DropdownMenuItem onClick={() => handleRecalculate(payroll)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recalcular
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkAsPaid(payroll)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como pagado
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Exportar</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport(payroll, "pdf")}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(payroll, "excel")}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <>
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Planillas Generadas
      </div>

      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empleado..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 max-w-sm"
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
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No hay planillas generadas
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
          onUpdate={(updatedPayroll) => {
            onPayrollsChange(
              payrolls.map((p) =>
                p.id === updatedPayroll.id ? updatedPayroll : p,
              ),
            );
          }}
        />
      )}
    </>
  );
}
