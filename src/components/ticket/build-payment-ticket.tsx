import { Payment } from "@/src/types/payments/type.payments";
import { formatCurrency } from "@/src/utils/currency-format";

export const buildPaymentTicketHtml = (
    p: Payment,
    currentUser: any,
    customerName: string
) => {
    return `
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
}