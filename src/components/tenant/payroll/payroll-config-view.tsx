"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { Edit, Plus, MoreHorizontal } from "lucide-react";

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

import { PayrollConfigForm } from "./payroll-config-form";
import type { PayrollConfig } from "@/src/types/payroll/type.payrollConfig";
import type { PayrollConfigListItemDTO } from "@/src/application/interfaces/payroll/PayrollPresentation";

interface PayrollConfigViewProps {
  configs: PayrollConfig[];
  members: { membershipId: string; userId: string; displayName: string; email?: string }[];
  onConfigSave: (data: any) => Promise<void>;
}

function formatCompensation(config: PayrollConfig): string {
  if (config.salaryType === "monthly") {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(config.baseSalary ?? 0);
  }
  return `${new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(config.hourlyRate ?? 0)} / hora`;
}

export function PayrollConfigView({
  configs,
  members,
  onConfigSave,
}: PayrollConfigViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PayrollConfig | null>(
    null,
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const dtoRows = useMemo<PayrollConfigListItemDTO[]>(
    () =>
      configs.map((config) => ({
        id: config.id,
        membershipId: config.membershipId,
        employeeName: members.find(m => m.membershipId === config.membershipId)?.displayName || config.membershipId,
        salaryType: config.salaryType,
        paySchedule: config.paySchedule,
        compensationLabel: formatCompensation(config),
        applyOvertime: config.applyOvertime,
        updatedAt: config.updatedAt,
      })),
    [configs, members],
  );

  const filteredData = useMemo(() => {
    const query = globalFilter.toLowerCase().trim();
    return dtoRows.filter((row) => {
      const matchesType = typeFilter === "all" || row.salaryType === typeFilter;
      if (!matchesType) return false;
      if (!query) return true;
      return (
        row.membershipId.toLowerCase().includes(query) ||
        row.employeeName.toLowerCase().includes(query)
      );
    });
  }, [dtoRows, globalFilter, typeFilter]);

  const columns = useMemo<ColumnDef<PayrollConfigListItemDTO>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: "Empleado",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.employeeName}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.membershipId}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "salaryType",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.salaryType === "monthly" ? "Mensual" : "Por hora"}
          </Badge>
        ),
      },
      {
        accessorKey: "compensationLabel",
        header: "Compensacion",
      },
      {
        accessorKey: "paySchedule",
        header: "Frecuencia",
      },
      {
        accessorKey: "applyOvertime",
        header: "Horas extra",
        cell: ({ row }) => (row.original.applyOvertime ? "Si" : "No"),
      },
      {
        accessorKey: "updatedAt",
        header: "Actualizado",
        cell: ({ row }) => row.original.updatedAt.toLocaleDateString("es-PE"),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const config = configs.find((item) => item.id === row.original.id);
          if (!config) return null;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setEditingConfig(config)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [configs],
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
        <div className="flex mb-5 items-center justify-between">
          <span className="flex text-2xl items-center gap-2">
            Configuracion salarial
          </span>
        </div>

        <div>
          <div className="lg:flex lg:w-full justify-between">
            <div className="mb-4 grid lg:flex items-center gap-4">
              <Input
                placeholder="Buscar por empleado o membership..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="max-w-sm"
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent portal={false}>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="hourly">Por hora</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4 flex w-full justify-end">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva configuracion
              </Button>
            </div>
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
                {table.getRowModel().rows.length > 0 ? (
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
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No hay configuraciones
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
      </div>

      {(showForm || editingConfig) && (
        <PayrollConfigForm
          config={editingConfig}
          members={members}
          onClose={() => {
            setShowForm(false);
            setEditingConfig(null);
          }}
          onSubmit={async (nextConfig) => {
            await onConfigSave(nextConfig);
            setShowForm(false);
            setEditingConfig(null);
          }}
        />
      )}
    </>
  );
}
