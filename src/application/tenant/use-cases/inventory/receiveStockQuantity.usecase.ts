import { StockRepository } from "../../../../domain/tenant/repositories/StockRepository";
import { StockLot } from "../../../../types/product/type.stockLote";

export interface ReceiveStockQuantityInput {
  tenantId: string;
  stockId: string;
  quantity: number;
  changedBy?: string;
}

export type ReceiveStockQuantityResult = {
  mode: "complete" | "partial";
  availableLot: StockLot;
  remainingLot?: StockLot;
};

export class ReceiveStockQuantityUseCase {
  constructor(private readonly stockRepo: StockRepository) {}

  async execute(
    input: ReceiveStockQuantityInput,
  ): Promise<ReceiveStockQuantityResult> {
    const lot = await this.stockRepo.getLotById(input.stockId);
    if (!lot) {
      throw new Error("Stock no encontrado");
    }
    if (lot.tenantId !== input.tenantId) {
      throw new Error("Stock no pertenece al tenant");
    }
    if (input.quantity <= 0) {
      throw new Error("Cantidad inválida");
    }
    if (input.quantity > lot.quantity) {
      throw new Error("Cantidad supera el stock en tránsito");
    }

    if (input.quantity === lot.quantity) {
      const updated = await this.stockRepo.updateStockLotStatus(
        lot.id,
        "disponible",
      );
      await this.stockRepo.addStockMovement({
        tenantId: lot.tenantId,
        stockLotId: lot.id,
        type: "recepcion_disponible",
        quantity: input.quantity,
        reason: "Recepción completa",
        changedBy: input.changedBy,
      });
      return { mode: "complete", availableLot: updated };
    }

    const availableLot =
      (await this.stockRepo.findAvailableLotLike(lot)) ||
      (await this.stockRepo.addStockLot({
        tenantId: lot.tenantId,
        productId: lot.productId,
        variantId: lot.variantId,
        branchId: lot.branchId,
        quantity: 0,
        barcode: lot.barcode,
        expirationDate: lot.expirationDate,
        lotNumber: lot.lotNumber,
        isForRent: lot.isForRent,
        isForSale: lot.isForSale,
        condition: lot.condition,
        status: "disponible",
      }));

    const updatedAvailable = await this.stockRepo.updateStockLotQuantity(
      availableLot.id,
      availableLot.quantity + input.quantity,
    );

    const remainingLot = await this.stockRepo.updateStockLotQuantity(
      lot.id,
      lot.quantity - input.quantity,
    );

    await this.stockRepo.addStockMovement({
      tenantId: lot.tenantId,
      stockLotId: updatedAvailable.id,
      type: "recepcion_transito",
      quantity: input.quantity,
      reason: "Recepción parcial",
      changedBy: input.changedBy,
    });

    return {
      mode: "partial",
      availableLot: updatedAvailable,
      remainingLot,
    };
  }
}
