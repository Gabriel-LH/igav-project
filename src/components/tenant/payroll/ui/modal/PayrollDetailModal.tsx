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
import { Calendar, DollarSign, Download, FileText, CheckCircle } from "lucide-react";
import type { PayrollItemDetailDTO } from "@/src/application/interfaces/payroll/PayrollPresentation";

interface PayrollDetailModalProps {
  payroll: PayrollItemDetailDTO;
  onClose: () => void;
  onMarkPaid: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
}

function statusLabel(status: PayrollItemDetailDTO["status"]) {
  if (status === "paid") return "Pagado";
  if (status === "calculated") return "Calculado";
  return "Borrador";
}

export function PayrollDetailModal({
  payroll,
  onClose,
  onMarkPaid,
}: PayrollDetailModalProps) {
  const earnings = payroll.lineItems.filter((item) => item.type === "earning");
  const deductions = payroll.lineItems.filter((item) => item.type === "deduction");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalle de planilla - {payroll.employeeName}</span>
            <Badge variant={payroll.status === "paid" ? "default" : "secondary"}>
              {statusLabel(payroll.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Periodo de pago
            </div>
            <p className="font-medium">
              {payroll.periodStart.toLocaleDateString("es-PE")} -{" "}
              {payroll.periodEnd.toLocaleDateString("es-PE")}
            </p>
            <p className="text-sm text-muted-foreground">
              Fecha de pago: {payroll.payDate.toLocaleDateString("es-PE")}
            </p>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 font-medium">
              <DollarSign className="h-4 w-4" />
              Ingresos
            </h3>
            <div className="space-y-2">
              {earnings.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>
                    {item.name}
                    {item.quantity ? ` (${item.quantity})` : ""}
                  </span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 font-medium">Descuentos</h3>
            <div className="space-y-2">
              {deductions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm text-red-600"
                >
                  <span>{item.name}</span>
                  <span>-{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span>Bruto</span>
              <span>{formatCurrency(payroll.grossTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Descuentos</span>
              <span>-{formatCurrency(payroll.deductionTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Neto a pagar</span>
              <span className="text-primary">{formatCurrency(payroll.netTotal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {payroll.status !== "paid" && (
              <Button
                onClick={() => {
                  onMarkPaid();
                  onClose();
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como pagado
              </Button>
            )}
            <Button variant="outline" onClick={() => console.log("Exportar PDF", payroll.id)}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => console.log("Exportar Excel", payroll.id)}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
