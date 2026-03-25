import { GuaranteeType } from "../../utils/status-type/GuaranteeType";
import { BaseOperation } from "./BaseOperation";

export interface RentalDTO extends BaseOperation {
  type: "alquiler";
  status:
    | "alquilado"
    | "reservado"
    | "pendiente_entrega"
    | "devuelto"
    | "atrasado"
    | "reservado_fisico";
  startDate: Date;
  endDate: Date;
  actualReturnDate?: Date;
  latePenalty?: number;
  damageCharge?: number;
  extensionAmount?: number;

  items: {
    id?: string; // RentalItem ID
    productId: string;
    productName: string;
    stockId: string;
    inventoryItemId?: string;
    quantity: number;
    variantId: string;
    variantAttributes?: Record<string, string>;
    priceAtMoment: number;
    listPrice?: number;
    discountAmount?: number;
    discountReason?: string;
    bundleId?: string;
    promotionId?: string;
  }[];
  financials: {
    subtotal: number;
    totalDiscount: number;
    taxAmount?: number;
    totalAmount: number;
    keepAsCredit: boolean;
    receivedAmount: number;
    paymentMethodId: string;
  };
  guarantee?: {
    type?: GuaranteeType | "por_cobrar";
    value?: string;
    description?: string;
    amount?: number;
  };
}
