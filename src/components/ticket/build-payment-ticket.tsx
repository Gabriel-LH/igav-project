import { Payment } from "@/src/types/payments/type.payments";
import { formatCurrency } from "@/src/utils/currency-format";

const getTicketTitle = (payment: Payment) => {
  if (payment.category === "refund") return "TICKET DE REEMBOLSO";
  if (payment.category === "correction") return "TICKET DE CORRECCION";
  return payment.direction === "out" ? "TICKET DE SALIDA" : "TICKET DE PAGO";
};

export const buildPaymentTicketHtml = (
  payment: Payment,
  currentUser: { firstName?: string; lastName?: string; name?: string },
  customerName: string,
) => {
  const sign = payment.direction === "out" ? "-" : "+";
  const receivedBy =
    currentUser.name ||
    `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim();

  return `
      <div style="width: 280px; font-family: monospace; font-size: 12px;">
        <h2 style="text-align: center; font-weight: bold;">${getTicketTitle(payment)}</h2>
        <hr style="border-style: dashed;" />
        <p>ID: ${payment.id}</p>
        <p>RECIBIDO POR: ${receivedBy || "-"}</p>
        <p>CLIENTE: ${customerName}</p>
        <p>FECHA: ${payment.date.toLocaleString("es-PE")}</p>
        <p>METODO: ${payment.method.toUpperCase()}</p>
        <p>CATEGORIA: ${payment.category.toUpperCase()}</p>
        <p>ESTADO: ${payment.status.toUpperCase()}</p>
        <hr style="border-style: dashed;" />
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>MOVIMIENTO:</span>
          <span>${sign} ${formatCurrency(payment.amount)}</span>
        </div>
        ${
          payment.reference
            ? `<p>REFERENCIA: ${payment.reference}</p>`
            : ""
        }
        ${
          payment.notes
            ? `<p>NOTA: ${payment.notes}</p>`
            : ""
        }
        <hr style="border-style: dashed;" />
        <p style="text-align: center;">Gracias por su preferencia</p>
        <p style="text-align: center;">Este no es un comprobante fiscal</p>
      </div>
    `;
};
