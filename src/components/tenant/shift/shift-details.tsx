// components/shifts/ShiftDetails.tsx
"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AssignmentForm } from "./assigment-form";
import type {
  Shift,
  ShiftAssignment,
} from "@/src/application/interfaces/shift/shift";
import {
  assignEmployeeToShiftAction,
  removeEmployeeFromShiftAction,
} from "@/src/app/(tenant)/tenant/actions/shift.actions";
import { toast } from "sonner";

interface ShiftDetailsProps {
  shift: Shift;
  assignments: ShiftAssignment[];
  onAssignmentsChange: (assignments: ShiftAssignment[]) => void;
  onBack: () => void;
}

export function ShiftDetails({
  shift,
  assignments,
  onAssignmentsChange,
  onBack,
}: ShiftDetailsProps) {
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [deletingAssignment, setDeletingAssignment] =
    useState<ShiftAssignment | null>(null);

  const columns: ColumnDef<ShiftAssignment>[] = [
    {
      accessorKey: "employeeName",
      header: "Empleado",
    },
    {
      accessorKey: "startDate",
      header: "Desde",
      cell: ({ row }) =>
        format(new Date(row.getValue("startDate")), "dd/MM/yyyy", {
          locale: es,
        }),
    },
    {
      accessorKey: "endDate",
      header: "Hasta",
      cell: ({ row }) => {
        const endDate = row.getValue("endDate");
        return endDate
          ? format(new Date(endDate as string), "dd/MM/yyyy", { locale: es })
          : "—";
      },
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
        const assignment = row.original;
        return (
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setDeletingAssignment(assignment)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: assignments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCreateAssignment = async (assignment: ShiftAssignment) => {
    try {
      const created = await assignEmployeeToShiftAction({
        shiftId: assignment.shiftId,
        employeeId: assignment.employeeId,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
      });
      onAssignmentsChange([...assignments, created]);
      setShowAssignmentForm(false);
    } catch (err) {
      toast.error("Error al asignar empleado", { description: !err });
    }
  };

  const handleDeleteAssignmentConfirmed = async () => {
    if (!deletingAssignment) return;
    try {
      await removeEmployeeFromShiftAction(deletingAssignment.id);
      onAssignmentsChange(
        assignments.filter((a) => a.id !== deletingAssignment.id),
      );
      setDeletingAssignment(null);
    } catch (err) {
      toast.error("Error al eliminar asignación", { description: !err });
    }
  };

  return (
    <>
      <div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <CardTitle>{shift.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {shift.startTime} - {shift.endTime} | Tolerancia:{" "}
              {shift.toleranceMinutes} min
            </p>
          </div>
          <Button onClick={() => setShowAssignmentForm(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Asignar empleado
          </Button>
        </div>
      </div>
      <div>
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-muted/80">
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
                    No hay empleados asignados a este turno.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {showAssignmentForm && (
        <AssignmentForm
          shift={shift}
          onClose={() => setShowAssignmentForm(false)}
          onSubmit={handleCreateAssignment}
        />
      )}

      {/* Modal de confirmación para eliminar asignación */}
      <AlertDialog
        open={!!deletingAssignment}
        onOpenChange={(open) => !open && setDeletingAssignment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Retirar empleado del turno?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Retirará as "
              {deletingAssignment?.employeeName}" de las asignaciones activas de
              este turno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignmentConfirmed}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Sí, retirar empleado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
