import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCardPosIcon,
  InformationCircleIcon,
  PrinterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Payment } from "../../../../types/payments/type.payments";
import { USER_MOCK } from "../../../../mocks/mock.user";
import { formatCurrency } from "@/src/utils/currency-format";
import { Badge } from "@/components/badge";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { AddPaymentForm } from "../forms/AddPaymentForm";
import { printTicket } from "@/src/utils/ticket/print-ticket";
import { ConfirmPrintModal } from "./ConfirmPrintModal";
import { DialogDescription } from "@radix-ui/react-dialog";
import { getOperationBalances } from "@/src/utils/payment-helpers";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
import { buildPaymentTicketHtml } from "@/src/components/ticket/build-payment-ticket";

interface PaymentHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: Payment[];
  totalOperation: number;
  operationId?: number | string;
  calculatedBalance: number;
  calculatedIsCredit: boolean;
  customerName: string;
  onAddPayment: (paymentData: any) => Payment;
}

const formatUserName = (receivedById: string) => {
  const user = USER_MOCK.find((currentUser) => currentUser.id === receivedById);
  return user ? `${user.firstName} ${user.lastName}` : "Sin registros";
};

export function PaymentHistoryModal({
  open,
  onOpenChange,
  payments,
  operationId,
  totalOperation,
  calculatedBalance,
  calculatedIsCredit,
  customerName,
  onAddPayment,
}: PaymentHistoryModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmPrintOpen, setConfirmPrintOpen] = useState(false);
  const [ticketToPrint, setTicketToPrint] = useState<string | null>(null);

  const { guarantees } = useGuaranteeStore.getState();
  const guaranteeData = guarantees.find((guarantee) => guarantee.operationId === operationId);

  const { totalPaid, creditAmount } = getOperationBalances(
    String(operationId || ""),
    payments,
    totalOperation,
  );

  const resolvedCreditAmount = calculatedIsCredit ? creditAmount : 0;
  const currentUser = USER_MOCK[0];

  const buildTicketHtml = (payment: Payment) =>
    buildPaymentTicketHtml(payment, currentUser, customerName);

  const fullHistoryTicket = useMemo(
    () => payments.map(buildTicketHtml).join(""),
    [payments],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-card text-card-foreground">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                className="text-blue-600"
                size={22}
              />
              Historial de Pagos
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <div className="p-6 pt-0 space-y-4">
            {showAddForm ? (
              <AddPaymentForm
                remainingBalance={calculatedBalance}
                onCancel={() => setShowAddForm(false)}
                onSave={(data) => {
                  const createdPayment = onAddPayment(data);
                  setShowAddForm(false);
                  setConfirmPrintOpen(true);
                  setTicketToPrint(buildTicketHtml(createdPayment));
                }}
              />
            ) : (
              <>
                {calculatedBalance > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(true)}
                    className="w-full text-blue-600 border hover:text-blue-500 font-bold"
                  >
                    <HugeiconsIcon
                      icon={CreditCardPosIcon}
                      strokeWidth={2.2}
                      className="text-blue-600"
                      size={22}
                    />
                    Registrar Nuevo Abono
                  </Button>
                )}
              </>
            )}

            <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
              <div className="max-h-[280px] overflow-y-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-[10px] uppercase text-muted-foreground sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Fecha / Recibio</th>
                      <th className="px-4 py-2.5 font-bold">Metodo / Estado</th>
                      <th className="px-4 py-2.5 text-right font-bold">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-[12px]">
                            {payment.date.toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatUserName(payment.receivedById)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="italic text-[11px] capitalize">
                            {payment.method}
                          </p>
                          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">
                            {payment.category.toUpperCase()} |{" "}
                            {payment.status.toUpperCase()}
                          </p>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-black ${
                            payment.direction === "out"
                              ? "text-red-500"
                              : "text-emerald-600"
                          }`}
                        >
                          {payment.direction === "out" ? "-" : "+"}{" "}
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => printTicket(buildTicketHtml(payment))}
                          >
                            <HugeiconsIcon icon={PrinterIcon} size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-border">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Costo Total Servicio:</span>
                <span className="font-bold">
                  {formatCurrency(totalOperation)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-emerald-600 font-bold">
                <span>Pagos netos procesados:</span>
                <span>{formatCurrency(totalPaid)}</span>
              </div>

              <div className="h-px w-full bg-border my-2" />

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase">
                  {calculatedIsCredit ? "Credito a favor:" : "Saldo Pendiente:"}
                </span>
                <span
                  className={`text-lg font-black ${
                    calculatedIsCredit
                      ? "text-blue-500"
                      : calculatedBalance === 0
                        ? "text-emerald-500"
                        : "text-foreground"
                  }`}
                >
                  {calculatedIsCredit
                    ? `+ ${formatCurrency(resolvedCreditAmount)}`
                    : calculatedBalance === 0
                      ? "PAGADO"
                      : formatCurrency(calculatedBalance)}
                </span>
              </div>

              {guaranteeData && (
                <div className="mt-4 p-3 rounded-lg border bg-card/50">
                  <p className="text-[9px] font-black uppercase mb-1 opacity-70">
                    Garantia en Resguardo
                  </p>
                  <div className="flex text-amber-500 justify-between items-center text-sm font-bold">
                    <span>
                      {guaranteeData.type === "dinero"
                        ? formatCurrency(Number(guaranteeData.value))
                        : guaranteeData.description}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] border uppercase"
                    >
                      {guaranteeData.status}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => printTicket(fullHistoryTicket)}
              className="w-full text-blue-600 border hover:text-blue-500 font-bold"
            >
              <HugeiconsIcon
                icon={PrinterIcon}
                strokeWidth={2.2}
                className="text-blue-600"
                size={22}
              />
              Imprimir Historial
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmPrintModal
        open={confirmPrintOpen}
        onOpenChange={setConfirmPrintOpen}
        ticketToPrint={ticketToPrint}
        onClose={() => setConfirmPrintOpen(false)}
      />
    </>
  );
}
