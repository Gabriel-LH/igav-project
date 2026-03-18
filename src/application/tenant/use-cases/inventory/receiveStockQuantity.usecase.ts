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

    // 1. Buscar si ya existe un lote disponible IDÉNTICO para consolidar
    // (Mismo tenant, producto, variante, sucursal, lote, vencimiento, condición, etc.)
    const existingAvailableLot = await this.stockRepo.findAvailableLotLike(lot);

    if (existingAvailableLot) {
      // Caso A: CONSOLIDAR en lote existente
      const updatedAvailable = await this.stockRepo.updateStockLotQuantity(
        existingAvailableLot.id,
        existingAvailableLot.quantity + input.quantity,
      );

      let remainingLot: StockLot | undefined;
      if (input.quantity === lot.quantity) {
        // Recepción completa -> Elimanamos el lote de tránsito original
        await this.stockRepo.deleteStockLot(lot.id);
      } else {
        // Recepción parcial -> Descontamos del de tránsito
        remainingLot = await this.stockRepo.updateStockLotQuantity(
          lot.id,
          lot.quantity - input.quantity,
        );
      }

      await this.stockRepo.addStockMovement({
        tenantId: lot.tenantId,
        stockLotId: updatedAvailable.id,
        type: input.quantity === lot.quantity ? "recepcion_disponible" : "recepcion_transito",
        quantity: input.quantity,
        reason: input.quantity === lot.quantity ? "Recepción completa (Consolidada)" : "Recepción parcial (Consolidada)",
        changedBy: input.changedBy,
      });

      return {
        mode: input.quantity === lot.quantity ? "complete" : "partial",
        availableLot: updatedAvailable,
        remainingLot,
      };
    }

    // Caso B: NO EXISTE lote idéntico disponible
    if (input.quantity === lot.quantity) {
      // Recepción completa: Simplemente cambiamos el estado del lote actual
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

    // Recepción parcial: Crear nuevo lote disponible y descontar del original
    const newAvailableLot = await this.stockRepo.addStockLot({
      tenantId: lot.tenantId,
      productId: lot.productId,
      variantId: lot.variantId,
      branchId: lot.branchId,
      quantity: input.quantity,
      barcode: lot.barcode,
      expirationDate: lot.expirationDate,
      lotNumber: lot.lotNumber,
      isForRent: lot.isForRent,
      isForSale: lot.isForSale,
      condition: lot.condition,
      status: "disponible",
    });

    const remainingLot = await this.stockRepo.updateStockLotQuantity(
      lot.id,
      lot.quantity - input.quantity,
    );

    await this.stockRepo.addStockMovement({
      tenantId: lot.tenantId,
      stockLotId: newAvailableLot.id,
      type: "recepcion_transito",
      quantity: input.quantity,
      reason: "Recepción parcial",
      changedBy: input.changedBy,
    });

    return {
      mode: "partial",
      availableLot: newAvailableLot,
      remainingLot,
    };
  }
}
