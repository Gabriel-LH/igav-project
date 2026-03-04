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
import { ArrowLeft, UserPlus } from "lucide-react";
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
import { AssignmentForm } from "./assigment-form";
import type {
  Shift,
  ShiftAssignment,
} from "@/src/application/interfaces/shift/shift";

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
  ];

  const table = useReactTable({
    data: assignments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCreateAssignment = (assignment: ShiftAssignment) => {
    onAssignmentsChange([...assignments, assignment]);
    setShowAssignmentForm(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
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
        </CardHeader>
        <CardContent>
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
                      No hay empleados asignados a este turno.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showAssignmentForm && (
        <AssignmentForm
          shift={shift}
          onClose={() => setShowAssignmentForm(false)}
          onSubmit={handleCreateAssignment}
        />
      )}
    </>
  );
}
