// components/payroll/PayrollDetailModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/badge";
import {
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  CheckCircle,
} from "lucide-react";
import type { Payroll } from "@/src/application/interfaces/payroll/payroll";

interface PayrollDetailModalProps {
  payroll: Payroll;
  onClose: () => void;
  onUpdate: (payroll: Payroll) => void;
}

export function PayrollDetailModal({
  payroll,
  onClose,
  onUpdate,
}: PayrollDetailModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const getStatusBadge = () => {
    const variants = {
      draft: {
        variant: "secondary" as const,
        label: "Borrador",
        icon: "📝",
        colorClass: "",
      },
      calculated: {
        variant: "default" as const,
        label: "Calculado",
        icon: "✅",
        colorClass: "",
      },
      paid: {
        variant: "default" as const,
        label: "Pagado",
        icon: "💰",
        colorClass: "bg-green-600 hover:bg-green-700",
      },
    };
    const statusInfo = variants[payroll.status];

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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalle de Pago - {payroll.employeeName}</span>
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Período */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              Período de pago
            </div>
            <p className="text-lg font-semibold">
              {monthNames[payroll.period.month - 1]} {payroll.period.year}
            </p>
          </div>

          {/* Resumen de asistencia */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Resumen de asistencia
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Días trabajados</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {payroll.summary.daysWorked}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Horas normales</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {payroll.summary.regularHours}h
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Horas extra</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {payroll.summary.overtimeHours}h
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Tardanzas</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {payroll.summary.lateMinutes} min
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cálculos de pago */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Desglose de pago
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Salario base</span>
                <span className="font-medium">
                  {formatCurrency(payroll.calculations.baseAmount)}
                </span>
              </div>

              {payroll.calculations.overtimeAmount > 0 && (
                <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Horas extra
                  </span>
                  <span className="font-medium">
                    +{formatCurrency(payroll.calculations.overtimeAmount)}
                  </span>
                </div>
              )}

              <Separator className="my-2" />

              {/* Descuentos */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Descuentos
                </span>

                {payroll.calculations.deductions.healthInsurance > 0 && (
                  <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                    <span>Seguro de salud</span>
                    <span>
                      -
                      {formatCurrency(
                        payroll.calculations.deductions.healthInsurance,
                      )}
                    </span>
                  </div>
                )}

                {payroll.calculations.deductions.pension > 0 && (
                  <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                    <span>Fondo de pensiones</span>
                    <span>
                      -{formatCurrency(payroll.calculations.deductions.pension)}
                    </span>
                  </div>
                )}

                {payroll.calculations.deductions.taxes > 0 && (
                  <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                    <span>Impuestos</span>
                    <span>
                      -{formatCurrency(payroll.calculations.deductions.taxes)}
                    </span>
                  </div>
                )}

                {payroll.calculations.deductions.others > 0 && (
                  <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                    <span>Otros descuentos</span>
                    <span>
                      -{formatCurrency(payroll.calculations.deductions.others)}
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-2" />

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-bold pt-2">
                <span className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  Total a pagar
                </span>
                <span className="text-primary">
                  {formatCurrency(payroll.calculations.total)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información adicional */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Generado: {payroll.generatedAt.toLocaleDateString()}</p>
            {payroll.paidAt && (
              <p>Pagado: {payroll.paidAt.toLocaleDateString()}</p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-4">
            {payroll.status === "calculated" && (
              <Button
                variant="default"
                onClick={() => {
                  const updated = {
                    ...payroll,
                    status: "paid" as const,
                    paidAt: new Date(),
                  };
                  onUpdate(updated);
                  onClose();
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como pagado
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => console.log("Exportar PDF")}
            >
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => console.log("Exportar Excel")}
            >
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
