// components/shifts/ShiftsTable.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { MoreHorizontal, Plus, Pencil, Copy, Eye, Power } from "lucide-react";
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
} from "@/components/select";
import { Badge } from "@/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { ShiftForm } from "../shift-form";
import type {
  Shift,
  WorkingDay,
} from "@/src/application/interfaces/shift/shift";

interface ShiftsTableProps {
  shifts: Shift[];
  onSelectShift: (shift: Shift) => void;
  onShiftsChange: (shifts: Shift[]) => void;
}

export function ShiftsTable({
  shifts,
  onSelectShift,
  onShiftsChange,
}: ShiftsTableProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [globalFilter, setGlobalFilter] = useState("");

  // Usar useMemo para los datos filtrados - esto evita cálculos innecesarios
  const filteredData = useMemo(() => {
    console.log("Filtrando datos, statusFilter:", statusFilter); // Para debugging
    if (statusFilter === "all") {
      return shifts;
    }
    return shifts.filter((shift) => shift.status === statusFilter);
  }, [shifts, statusFilter]);

  const handleCreateShift = useCallback(
    (newShift: Shift) => {
      onShiftsChange([...shifts, newShift]);
      setShowCreateForm(false);
    },
    [shifts, onShiftsChange],
  );

  const handleUpdateShift = useCallback(
    (updatedShift: Shift) => {
      onShiftsChange(
        shifts.map((s) => (s.id === updatedShift.id ? updatedShift : s)),
      );
      setEditingShift(null);
    },
    [shifts, onShiftsChange],
  );

  const handleDuplicateShift = useCallback(
    (shift: Shift) => {
      const duplicatedShift: Shift = {
        ...shift,
        id: crypto.randomUUID(),
        name: `${shift.name} (copia)`,
        status: "inactive",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      onShiftsChange([...shifts, duplicatedShift]);
    },
    [shifts, onShiftsChange],
  );

  const handleToggleStatus = useCallback(
    (shift: Shift) => {
      const newStatus: "active" | "inactive" =
        shift.status === "active" ? "inactive" : "active";

      const updatedShift: Shift = {
        ...shift,
        status: newStatus,
        updatedAt: new Date(),
      };
      onShiftsChange(shifts.map((s) => (s.id === shift.id ? updatedShift : s)));
    },
    [shifts, onShiftsChange],
  );

  const formatWorkingDays = useCallback((days: WorkingDay[]): string => {
    const activeDays = days.filter((d) => d.active).map((d) => d.label);
    if (activeDays.length === 0) return "Ninguno";
    if (activeDays.length === 7) return "Todos";
    return activeDays.join(", ");
  }, []);

  // Las columnas también deben ser memorizadas
  const columns = useMemo<ColumnDef<Shift>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "startTime",
        header: "Entrada",
      },
      {
        accessorKey: "endTime",
        header: "Salida",
      },
      {
        id: "workingDays",
        header: "Días",
        cell: ({ row }) => formatWorkingDays(row.original.workingDays),
      },
      {
        accessorKey: "toleranceMinutes",
        header: "Tolerancia",
        cell: ({ row }) => `${row.getValue("toleranceMinutes")} min`,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge variant={status === "active" ? "default" : "secondary"}>
              {status === "active" ? "Activo" : "Inactivo"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const shift = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setEditingShift(shift)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicateShift(shift)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToggleStatus(shift)}>
                  <Power className="mr-2 h-4 w-4" />
                  {shift.status === "active" ? "Desactivar" : "Activar"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelectShift(shift)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver empleados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      formatWorkingDays,
      handleDuplicateShift,
      handleToggleStatus,
      onSelectShift,
    ],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  // Manejador del cambio de filtro simplificado
  const handleStatusFilterChange = useCallback((value: string) => {
    console.log("Cambiando filtro a:", value); // Para debugging
    setStatusFilter(value);
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Turnos</CardTitle>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear turno
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Buscar turnos..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
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
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
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
                      No hay resultados.
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
        </CardContent>
      </Card>

      {/* Modal para crear/editar turno */}
      {(showCreateForm || editingShift) && (
        <ShiftForm
          shift={editingShift}
          onClose={() => {
            setShowCreateForm(false);
            setEditingShift(null);
          }}
          onSubmit={editingShift ? handleUpdateShift : handleCreateShift}
        />
      )}
    </>
  );
}
