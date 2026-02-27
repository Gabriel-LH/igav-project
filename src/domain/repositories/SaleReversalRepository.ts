import { SaleReversal } from "../../types/sales/type.saleReversal";

export interface SaleReversalRepository {
  addReversal(reversal: SaleReversal): void;
}
