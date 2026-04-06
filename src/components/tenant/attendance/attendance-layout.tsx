"use client";

import { AttendanceCalendar } from "./ui/AttendanceCalendar";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "sonner";
import { markAttendanceAction, scanDniAction, justifyAbsenceAction } from "@/src/app/(tenant)/tenant/actions/attendance.actions";
import { useState } from "react";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Ocurrio un error inesperado";
};

export function AttendanceLayout() {
  // Key to force refresh the calendar when an action completes
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMarkAttendance = async (data: {
    employeeId: string;
    date: Date;
    checkIn: string;
    checkOut: string;
    shift: string;
    shiftId?: string;
    notes?: string;
    status: string;
    lateMinutes?: number;
    extraMinutes?: number;
  }) => {
    try {
      await markAttendanceAction({
        employeeId: data.employeeId,
        date: data.date,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        shift: data.shift,
        shiftId: data.shiftId,
        notes: data.notes,
        status: data.status,
        lateMinutes: data.lateMinutes,
        extraMinutes: data.extraMinutes,
      });
      toast.success("Asistencia registrada correctamente");
      setRefreshKey(prev => prev + 1);
    } catch (e: unknown) {
      toast.error("Error al registrar asistencia", {
        description: getErrorMessage(e),
      });
    }
  };

  const handleJustifyAbsence = async (data: {
    employeeId: string;
    date: Date;
    justification: string;
    notes: string;
  }) => {
    try {
      await justifyAbsenceAction(data);
      toast.success("Ausencia justificada correctamente");
      setRefreshKey(prev => prev + 1);
    } catch (e: unknown) {
      toast.error("Error al justificar ausencia", {
        description: getErrorMessage(e),
      });
    }
  };

  const handleScanDni = async (dni: string) => {
    try {
      await scanDniAction(dni);
      toast.success("DNI escaneado y registrado");
      setRefreshKey(prev => prev + 1);
    } catch (e: unknown) {
      toast.error("Error en escaneo", {
        description: getErrorMessage(e),
      });
    }
  };

  const handleExportExcel = () => {
    toast.info("Exportando a Excel...");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportExcel}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <AttendanceCalendar
        key={refreshKey}
        onMarkAttendance={handleMarkAttendance}
        onJustifyAbsence={handleJustifyAbsence}
        onScanDni={handleScanDni}
      />
    </div>
  );
}
