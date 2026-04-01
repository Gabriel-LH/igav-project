// components/attendance/AttendanceLayout.tsx
"use client";

import { AttendanceCalendar } from "./ui/AttendanceCalendar";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "sonner";

export function AttendanceLayout() {
  const handleMarkAttendance = (data: {
    employeeId: string;
    date: Date;
    checkIn: string;
    checkOut: string;
    notes?: string;
    status: string;
  }) => {
    // Simular guardado
    console.log("Marcando asistencia:", data);
    toast.success("Asistencia registrada correctamente");
  };

  const handleScanDni = (dni: string) => {
    console.log("DNI escaneado:", dni);
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

      {/* Calendario principal */}
      <AttendanceCalendar
        onMarkAttendance={handleMarkAttendance}
        onScanDni={handleScanDni}
      />
    </div>
  );
}
