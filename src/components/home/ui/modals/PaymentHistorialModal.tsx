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
import { MOCK_GUARANTEE } from "../../../../mocks/mock.guarantee";
import { Badge } from "@/components/badge";
import { useState } from "react";
import { Button } from "@/components/button";
import { AddPaymentForm } from "../forms/AddPaymentForm";
import { printTicket } from "@/src/utils/ticket/print-ticket";
import { ConfirmPrintModal } from "./ConfirmPrintModal";
import { DialogDescription } from "@radix-ui/react-dialog";
import { getOperationBalances } from "@/src/utils/payment-helpers";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
interface PaymentHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: Payment[];
  totalOperation: number;
  operationId?: number | string; // Agregado
  calculatedBalance: number;
  calculatedIsCredit: boolean;
  customerName: string;
  onAddPayment: (paymentData: any) => Payment;
}

export function PaymentHistoryModal({
  open,
  onOpenChange,
  payments,
  operationId,
  totalOperation, // Este es el costo total (ej. 180)
  calculatedBalance,
  calculatedIsCredit,
  customerName,
  onAddPayment,
}: PaymentHistoryModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmPrintOpen, setConfirmPrintOpen] = useState(false);
  const [ticketToPrint, setTicketToPrint] = useState<string | null>(null);

  const { guarantees } = useGuaranteeStore.getState();

  const guaranteeData = guarantees.find((g) => g.operationId === operationId);

  const {
    balance: currentBalance,
    creditAmount: currentCredit,
    isCredit,
    totalPaid,
  } = getOperationBalances(String(operationId || ""), payments, totalOperation);

  const totalPagadoAlquiler = payments.reduce((acc, p) => acc + p.amount, 0);

  const creditAmount = calculatedIsCredit
    ? totalPagadoAlquiler - totalOperation
    : 0;

  const receivedByName =
    payments.length > 0
      ? USER_MOCK.find((u) => u.id === payments[0].receivedById)?.name
      : "Sin registros";

  const currentUser = USER_MOCK[0];

  const buildTicketHtml = (p: Payment) => `
  <div style="width: 280px; font-family: monospace; font-size: 12px;">
    <h2 style="text-align: center; font-weight: bold;">${
      p.type === "cuota"
        ? "TICKET DE CUOTA"
        : p.type === "adelanto"
          ? "TICKET DE ADELANTO"
          : "TICKET DE PAGO"
    }</h2>
    <hr style="border-style: dashed;" />
    <p> ID: ${p.id}</p>
    <p>RECIBIDO POR: ${currentUser.name || ""}</p>
    <p>CLIENTE: ${customerName}</p>
    <p>FECHA: ${p.date.toLocaleString("es-PE")}</p>
    <p>METODO: ${p.method.toUpperCase()}</p>
    <hr style="border-style: dashed;" />
    <div style="display: flex; justify-content: space-between; font-weight: bold;">
      <span>MONTO ABONADO:</span>
      <span>${formatCurrency(p.amount)}</span>
    </div>
    ${
      p.changeAmount && p.changeAmount > 0
        ? `
      <p>RECIBIDO: ${formatCurrency(p.receivedAmount || 0)}</p>
      <p>VUELTO: ${formatCurrency(p.changeAmount)}</p>
    `
        : ""
    }
    <hr style="border-style: dashed;" />
    <p style="text-align: center;">¡Gracias por su preferencia!</p>
    <p style="text-align: center;">Este no es un comprobante fiscal </p>
  </div>
`;
  const fullHistoryTicket = payments.map(buildTicketHtml).join("");

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
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-0 space-y-4">
            {/* SI EL FORM ESTÁ ABIERTO, SE MUESTRA */}
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
                {/* BOTÓN PARA ABRIR FORM (Solo si hay deuda) */}
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
                    />{" "}
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
                      <th className="px-4 py-2.5 font-bold">Fecha / Recibió</th>
                      <th className="px-4 py-2.5 font-bold">
                        Método / Detalle
                      </th>
                      <th className="px-4 py-2.5 text-right font-bold">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((p) => (
                      <tr
                        key={`${p.id}-${p.type}`}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-[12px]">
                            {p.date.toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {receivedByName}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="italic text-[11px] capitalize">
                            {p.method}
                          </p>
                          {/* ESTO MUESTRA EL VUELTO EN LA TABLA */}
                          {p.changeAmount
                            ? p.changeAmount > 0 && (
                                <p className="text-[9px] text-orange-500 font-medium mt-0.5">
                                  Recibió:{" "}
                                  {formatCurrency(p.receivedAmount || 0)} |
                                  Vuelto: -{formatCurrency(p.changeAmount)}
                                </p>
                              )
                            : null}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-black ${
                            p.type === "cuota"
                              ? "text-amber-500"
                              : "text-emerald-600"
                          }`}
                        >
                          {formatCurrency(p.amount)}
                        </td>
                        {/* BOTÓN DE IMPRESIÓN */}
                        <td className="px-2 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              const paymentWithName = {
                                ...p,
                                receivedByName:
                                  USER_MOCK.find((u) => u.id === p.receivedById)
                                    ?.name || "Desconocido",
                              };
                              printTicket(buildTicketHtml(paymentWithName));
                            }}
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
                <span>Pagos procesados:</span>
                <span>- {formatCurrency(totalPagadoAlquiler)}</span>
              </div>

              <div className="h-px w-full bg-border my-2" />

              {/* Sección de Saldo/Crédito dinámica */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase">
                  {calculatedIsCredit ? "Crédito a favor:" : "Saldo Pendiente:"}
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
                    ? `+ ${formatCurrency(creditAmount)}`
                    : calculatedBalance === 0
                      ? "PAGADO"
                      : formatCurrency(calculatedBalance)}
                </span>
              </div>

              {/* GARANTÍA - Solo visual, no afecta saldos */}
              {guaranteeData && (
                <div className="mt-4 p-3 rounded-lg border bg-card/50 ">
                  <p className="text-[9px] font-black uppercase mb-1 opacity-70">
                    Garantía en Resguardo
                  </p>
                  <div className="flex text-amber-500 justify-between items-center text-sm font-bold">
                    <span>
                      {guaranteeData.type === "dinero"
                        ? formatCurrency(guaranteeData.value)
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
              />{" "}
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
