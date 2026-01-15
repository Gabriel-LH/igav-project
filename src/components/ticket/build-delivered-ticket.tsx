// utils/ticket/build-delivery-ticket.ts
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";
import { Guarantee } from "@/src/types/guarantee/type.guarantee";
import { formatCurrency } from "@/src/utils/currency-format";

export const buildDeliveryTicketHtml = (
  reservation: any,
  client: any,
  items: any[],
  guaranteeRecord: Guarantee | undefined
) => {
  const productsList = items
    .map((item) => {
      // BUSCAMOS EL PRODUCTO REAL EN EL MOCK
      const productInfo = PRODUCTS_MOCK.find((p) => p.id === item.productId);
      const productName = productInfo
        ? productInfo.name
        : "Producto no encontrado";

      return `
        <div style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="max-width: 70%;">
              <div style="font-weight: bold; text-transform: uppercase;">${productName}</div>
              <div style="font-size: 10px; color: #666;">
                Talla: ${item.size} | Color: ${item.color} | Cant: ${
        item.quantity
      }
              </div>
            </div>
            <span style="font-weight: bold;">${formatCurrency(
              item.priceAtMoment
            )}</span>
          </div>
          ${
            item.notes
              ? `<div style="font-size: 10px; font-style: italic; color: #555; margin-top: 2px;">Nota: ${item.notes}</div>`
              : ""
          }
        </div>`;
    })
    .join("");

  return `
    <div style="width: 280px; font-family: monospace; font-size: 12px; line-height: 1.4; color: #000; background: #fff; padding: 10px;">
    <div style="text-align: center; margin-bottom: 10px;">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="36"
    height="36"
    fill="none"
    stroke="#000"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    style="display: block; margin: 0 auto 6px auto;"
  >
    <path d="M17.5 8.75L15.0447 19.5532C15.015 19.684 15 19.8177 15 19.9518C15 20.9449 15.8051 21.75 16.7982 21.75H18"/>
    <path d="M19.2192 21.75H4.78078C3.79728 21.75 3 20.9527 3 19.9692C3 19.8236 3.01786 19.6786 3.05317 19.5373L5.24254 10.7799C5.60631 9.32474 5.78821 8.59718 6.33073 8.17359C6.87325 7.75 7.6232 7.75 9.12311 7.75H14.8769C16.3768 7.75 17.1267 7.75 17.6693 8.17359C18.2118 8.59718 18.3937 9.32474 18.7575 10.7799L20.9468 19.5373C20.9821 19.6786 21 19.8236 21 19.9692C21 20.9527 20.2027 21.75 19.2192 21.75Z"/>
    <path d="M15 7.75V5.75C15 4.09315 13.6569 2.75 12 2.75C10.3431 2.75 9 4.09315 9 5.75V7.75"/>
    <path d="M10 10.75H12.5"/>
  </svg>

  <h2
    style="
      margin: 0;
      font-size: 13px;
      display: inline-block;
      padding: 2px 8px;
      letter-spacing: 0.5px;
    "
  >
    CONTROL DE SALIDA
  </h2>

  <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: bold;">
    ${reservation.id}
  </p>
</div>

      <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin-bottom: 10px; font-size: 11px;">
        <p style="margin: 2px 0;"><strong>CLIENTE:</strong> ${
          client.firstName
        } ${client.lastName}</p>
        <p style="margin: 2px 0;"><strong>DNI:</strong> ${client.dni}</p>
        <p style="margin: 2px 0;"><strong>TEL:</strong> ${client.phone}</p>
      </div>

      <div style="margin-bottom: 10px; font-size: 11px;">
       <p style="margin: 2px 0;"><strong>GARANTIA:</strong> ${
         guaranteeRecord // 👈 Si existe el registro...
           ? guaranteeRecord.type === "efectivo"
             ? formatCurrency(guaranteeRecord.value) // Muestra $ si es efectivo
             : guaranteeRecord.description // Muestra "DNI", "Pasaporte", etc.
           : "FALTA GARANTÍA"
       }</p>
        <p style="margin: 2px 0;"><strong>FECHA SALIDA:</strong> ${reservation.startDate.toLocaleDateString(
          "es-PE"
        )}</p>
        <p style="margin: 2px 0; color: #000;"><strong>DEVOLUCIÓN:</strong> <span style="font-size: 13px; font-weight: black;">${reservation.endDate.toLocaleDateString(
          "es-PE"
        )}</span></p>
        <p style="margin: 2px 0;"><strong>HORA ENTREGA:</strong> ${
          reservation.hour
        }</p>
      </div>

      <div style="margin-bottom: 10px;">
        <p style="font-weight: bold; text-decoration: underline; margin-bottom: 5px; font-size: 10px;">DETALLE DE PRENDAS:</p>
        ${productsList}
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto 5px auto;"></div>
        <p style="font-size: 10px; margin: 0;">FIRMA DEL CLIENTE</p>
        <p style="font-size: 8px; margin-top: 15px; line-height: 1.2;">
          Al firmar, declaro recibir las prendas en óptimas condiciones. 
          Me comprometo a devolverlas en la fecha pactada para evitar penalizaciones.
        </p>
      </div>

      <p style="text-align: center; font-size: 9px; margin-top: 20px; border-top: 1px solid #eee; pt-2">
        Generado el ${new Date().toLocaleString()}
      </p>
    </div>
  `;
};
