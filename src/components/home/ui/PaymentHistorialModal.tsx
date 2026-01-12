import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Payment } from "../../../types/payments/type.payments";
import { USER_MOCK } from "../../../mocks/mock.user";
import { formatCurrency } from "@/src/utils/currency-format";

interface PaymentHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: Payment[];
  totalOperation: number;
}

export function PaymentHistoryModal({
  open,
  onOpenChange,
  payments,
  totalOperation,
}: PaymentHistoryModalProps) {
  const totalPagado = payments.reduce((acc, p) => acc + p.amount, 0);

  const receivedByName =
    payments.length > 0
      ? USER_MOCK.find((p) => p.id === payments[0].receivedById)?.name
      : "Sin registros";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {" "}
        {/* p-0 para controlar los bordes */}
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              className="text-blue-600"
              size={22}
            />
            Historial de Pagos
          </DialogTitle>
          <DialogDescription>
            Registro de abonos realizados para esta operación.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0 space-y-4">
          {/* Listado de Pagos con Scroll si hay muchos */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="max-h-[280px] overflow-y-auto">
              {payments.length > 0 ? (
                <table className="w-full text-sm  text-left border-collapse">
                  <thead className="bg-muted/50  text-[10px] uppercase text-muted-foreground sticky ">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Fecha / Recibió</th>
                      <th className="px-4 py-2.5 font-bold">Método</th>
                      <th className="px-4 py-2.5 text-right font-bold">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-[12px] text-foreground leading-none mb-1">
                            {p.date.toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {receivedByName}
                          </p>
                        </td>
                        <td className="px-4 py-3 italic text-[11px] text-muted-foreground capitalize">
                          {p.method}
                          {p.reference && (
                            <span className="block text-[9px] text-primary/70 not-italic">
                              Ref: {p.reference}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm italic">
                  No hay pagos registrados aún.
                </div>
              )}
            </div>
          </div>

          {/* Resumen Final: Se corrigió el Separator manual */}
          <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-border">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Costo Total:
              </span>
              <span className="font-semibold">
                ${totalOperation.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs text-emerald-600 font-bold">
              <span>Total Abonado:</span>
              <span>- ${totalPagado.toLocaleString()}</span>
            </div>

            {/* Divisor Manual Simple */}
            <div className="h-px w-full bg-border my-2" />

            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-tight">
                Deuda Actual:
              </span>
              <span className="text-lg font-black text-orange-600">
                ${(totalOperation - totalPagado).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
