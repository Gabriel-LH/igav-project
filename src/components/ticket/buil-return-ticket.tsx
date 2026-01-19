// utils/ticket/build-return-ticket.ts
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";
import { Guarantee } from "@/src/types/guarantee/type.guarantee";
import { formatCurrency } from "@/src/utils/currency-format";

export const buildReturnTicketHtml = (
  reservation: any,
  client: any,
  items: any[],
  guaranteeRecord: Guarantee | undefined,
  inspection: {
    itemsInspection: Record<string, string>;
    damageNotes?: string;
  },
  summary: {
    daysLate: number;
    penaltyAmount: number;
    extraDamageCharge: number;
    totalToPay: number;
    refundAmount: number;
    debtAmount: number;
    isCash: boolean;
  }
) => {
  const productsList = items
    .map((item) => {
      const productInfo = PRODUCTS_MOCK.find((p) => p.id === item.productId);
      const status = inspection.itemsInspection[item.productId];

      return `
      <div style="margin-bottom:6px;border-bottom:1px dashed #ddd;padding-bottom:4px;">
        <div style="font-weight:bold;text-transform:uppercase;">
          ${productInfo?.name || "Producto"}
        </div>
        <div style="font-size:10px;color:#555;">
          Talla: ${item.size} | Color: ${item.color}
        </div>
        <div style="font-size:10px;font-weight:bold;">
          Estado: ${status?.toUpperCase()}
        </div>
      </div>
    `;
    })
    .join("");

  return `
  <div style="width:280px;font-family:monospace;font-size:12px;line-height:1.4;padding:10px;">
    
    <div style="text-align:center;margin-bottom:8px;">
      <h2 style="margin:0;font-size:13px;">TICKET DE DEVOLUCIÓN</h2>
      <p style="margin:2px 0;font-size:10px;font-weight:bold;">${reservation.id}</p>
    </div>

    <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:6px 0;font-size:11px;">
      <p><strong>CLIENTE:</strong> ${client.firstName} ${client.lastName}</p>
      <p><strong>DNI:</strong> ${client.dni}</p>
      <p><strong>TEL:</strong> ${client.phone}</p>
    </div>

    <div style="margin:8px 0;font-size:11px;">
      <p><strong>FECHA SALIDA:</strong> ${reservation.startDate.toLocaleDateString(
        "es-PE"
      )}</p>
      <p><strong>FECHA DEVOLUCION ACORDADA:</strong> ${reservation.endDate.toLocaleDateString(
        "es-PE"
      )}</p>
      <p><strong>FECHA DEVOLUCIÓN REAL:</strong> ${new Date().toLocaleDateString(
        "es-PE"
      )}</p>
      <p><strong>GARANTÍA:</strong> ${
        guaranteeRecord
          ? guaranteeRecord.type === "efectivo"
            ? formatCurrency(guaranteeRecord.value)
            : guaranteeRecord.description
          : "NO REGISTRADA"
      }</p>
    </div>

    <div>
      <p style="font-size:10px;font-weight:bold;text-decoration:underline;">
        INSPECCIÓN DE PRENDAS
      </p>
      ${productsList}
    </div>

    ${
      inspection.damageNotes
        ? `
      <div style="margin-top:6px;font-size:10px;">
        <strong>OBSERVACIONES:</strong><br/>
        ${inspection.damageNotes}
      </div>
    `
        : ""
    }

    <div style="margin-top:8px;border-top:1px dashed #000;padding-top:6px;">
      <p style="font-size:10px;font-weight:bold;">LIQUIDACIÓN</p>

      ${
        summary.daysLate > 0
          ? `<div style="font-size:11px;">Mora (${summary.daysLate} días): -${formatCurrency(
              summary.penaltyAmount
            )}</div>`
          : ""
      }

      ${
        summary.extraDamageCharge > 0
          ? `<div style="font-size:11px;">Daños: -${formatCurrency(
              summary.extraDamageCharge
            )}</div>`
          : ""
      }

      <div style="border-top:1px solid #000;margin-top:4px;padding-top:4px;font-weight:bold;">
        ${
          summary.isCash
            ? `A DEVOLVER: ${formatCurrency(summary.refundAmount)}`
            : `TOTAL A COBRAR: ${formatCurrency(summary.totalToPay)}`
        }
      </div>
    </div>

    <div style="margin-top:20px;text-align:center;">
      <div style="border-top:1px solid #000;width:80%;margin:0 auto 4px;"></div>
      <p style="font-size:10px;">FIRMA DEL CLIENTE</p>
    </div>

    <p style="text-align:center;font-size:9px;margin-top:10px;">
      Generado el ${new Date().toLocaleString()}
    </p>
  </div>
  `;
};
