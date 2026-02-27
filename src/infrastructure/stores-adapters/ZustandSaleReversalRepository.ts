import { SaleReversalRepository } from "../../domain/repositories/SaleReversalRepository";
import { useSaleReversalStore } from "../../store/useSaleReversalStore";
import { SaleReversal } from "../../types/sales/type.saleReversal";

export class ZustandSaleReversalRepository implements SaleReversalRepository {
  addReversal(reversal: SaleReversal): void {
    useSaleReversalStore.getState().addReversal(reversal);
  }
}
