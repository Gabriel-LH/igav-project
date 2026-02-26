"use client";

import { useEffect, useMemo, useState } from "react";
import { useBarcodeScanner } from "@/src/hooks/useBarcodeScanner";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useCartStore } from "@/src/store/useCartStore";
import { toast } from "sonner";
import { PosProductSection } from "./pos-product-section";
import { PosCartSection } from "./pos-cart-section";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/badge";
import { ensurePromotionsLoaded } from "@/src/services/promotionService";
import { USER_MOCK } from "@/src/mocks/mock.user";

export function PosLayout() {
  const { products, inventoryItems, stockLots } = useInventoryStore();
  const { addItem, applyPromotions, items } = useCartStore();

  const [preferredMode, setPreferredMode] = useState<"venta" | "alquiler">(
    "alquiler",
  );

  useEffect(() => {
    ensurePromotionsLoaded();
  }, []);

  const promotionsFingerprint = useMemo(
    () =>
      items
        .map(
          (i) =>
            [
              i.cartId,
              i.product.id,
              i.product.tenantId,
              i.operationType,
              i.quantity,
              i.listPrice ?? 0,
              i.bundleId ?? "",
              i.appliedPromotionId ?? "",
            ].join("::"),
        )
        .join("|"),
    [items],
  );

  useEffect(() => {
    if (items.length === 0) return;
    applyPromotions(USER_MOCK[0].branchId!);
  }, [promotionsFingerprint, items.length, applyPromotions]);

  useBarcodeScanner({
    onScan: (code) => {
      console.log("Escaneado:", code);

      // 1. BUSCAR EN INVENTARIO (Seriales o Lotes)
      const serialItem = inventoryItems.find((i) => i.serialCode === code);
      const lotItem = stockLots.find((l) => l.variantCode === code);

      let productToAdd = null;
      let operationMode: "venta" | "alquiler" = preferredMode;
      let specificCode = undefined;
      let scannedVariant = undefined;
      let maxStock = 0;

      if (serialItem) {
        // --- CASO 1: SERIALIZADO ---
        if (serialItem.status !== "disponible") {
          toast.error(
            `Este ítem no está disponible. Estado: ${serialItem.status}`,
          );
          return;
        }

        productToAdd = products.find((p) => p.id === serialItem.productId);
        specificCode = serialItem.id; // 🔥 Usamos UUID
        scannedVariant = { size: serialItem.sizeId, color: serialItem.colorId };

        if (serialItem.isForSale && !serialItem.isForRent)
          operationMode = "venta";
        else if (!serialItem.isForSale && serialItem.isForRent)
          operationMode = "alquiler";
        else operationMode = preferredMode;

        maxStock = inventoryItems.filter(
          (i) =>
            i.productId === serialItem.productId &&
            i.sizeId === serialItem.sizeId &&
            i.colorId === serialItem.colorId &&
            i.status === "disponible" &&
            (operationMode === "venta" ? i.isForSale : i.isForRent),
        ).length;
      } else if (lotItem) {
        // --- CASO 2: LOTE ---
        if ((lotItem.status as any) === "agotado" || lotItem.quantity <= 0) {
          toast.error("Este lote está agotado.");
          return;
        }

        productToAdd = products.find((p) => p.id === lotItem.productId);
        specificCode = lotItem.id; // 🔥 Usamos UUID
        scannedVariant = { size: lotItem.sizeId, color: lotItem.colorId };

        if (lotItem.isForSale && !lotItem.isForRent) operationMode = "venta";
        else if (!lotItem.isForSale && lotItem.isForRent)
          operationMode = "alquiler";
        else operationMode = preferredMode;

        maxStock = lotItem.quantity;
      } else {
        // --- CASO 3: SKU GENÉRICO DE PRODUCTO ---
        productToAdd = products.find((p) => p.sku === code);
        if (productToAdd) {
          if (productToAdd.can_sell && !productToAdd.can_rent)
            operationMode = "venta";
          else if (!productToAdd.can_sell && productToAdd.can_rent)
            operationMode = "alquiler";
          else operationMode = preferredMode;

          // Stock genérico (sin variantes)
          if (productToAdd.is_serial) {
            maxStock = inventoryItems.filter(
              (i) =>
                i.productId === productToAdd!.id &&
                i.status === "disponible" &&
                (operationMode === "venta" ? i.isForSale : i.isForRent),
            ).length;
          } else {
            maxStock = stockLots
              .filter(
                (l) =>
                  l.productId === productToAdd!.id &&
                  l.status === "disponible" &&
                  (operationMode === "venta" ? l.isForSale : l.isForRent),
              )
              .reduce((acc, curr) => acc + curr.quantity, 0);
          }
        }
      }

      if (!productToAdd) {
        toast.error(`Código no encontrado: ${code}`);
        return;
      }

      // 2. VALIDACIONES DE SEGURIDAD
      if (operationMode === "venta" && !productToAdd.can_sell) {
        toast.warning(`El producto ${productToAdd.name} no permite VENTA`);
        return;
      }
      if (operationMode === "alquiler" && !productToAdd.can_rent) {
        toast.warning(`El producto ${productToAdd.name} no permite ALQUILER`);
        return;
      }

      // 4. VALIDAR CARRITO ACTUAL
      const currentInCart =
        items.find(
          (i) =>
            i.product.id === productToAdd!.id &&
            i.operationType === operationMode &&
            (!scannedVariant ||
              (i.selectedSizeId === scannedVariant.size &&
                i.selectedColorId === scannedVariant.color)),
        )?.quantity || 0;

      if (currentInCart >= maxStock) {
        toast.error(
          `Stock insuficiente para ${operationMode}. Quedan: ${maxStock}`,
        );
        return;
      }

      // Validar duplicidad de serial específico
      if (specificCode && productToAdd.is_serial) {
        const isSerialInCart = items.some((i) =>
          i.selectedCodes.includes(specificCode!),
        );
        if (isSerialInCart) {
          toast.error("Este ítem específico ya está en el carrito.");
          return;
        }
      }

      // 5. AGREGAR AL CARRITO
      addItem(
        productToAdd,
        operationMode,
        specificCode,
        maxStock,
        scannedVariant,
      );

      const modeLabel = operationMode === "venta" ? "VENTA" : "ALQUILER";
      if (operationMode !== preferredMode) {
        toast.info(`Agregado como ${modeLabel} (Restricción del ítem)`);
      } else {
        toast.success(`${productToAdd.name} agregado`);
      }
    },
  });

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden gap-2">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white rounded-lg mx-4 mt-2 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono opacity-70">MODO ESCÁNER:</span>
          <Badge
            variant="outline"
            className={`font-bold uppercase border-0 ${preferredMode === "venta" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}
          >
            {preferredMode} (AUTO)
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Label
            htmlFor="mode-switch"
            className={`text-xs cursor-pointer ${preferredMode === "alquiler" ? "text-white font-bold" : "text-slate-400"}`}
          >
            Alquiler
          </Label>
          <Switch
            id="mode-switch"
            checked={preferredMode === "venta"}
            onCheckedChange={(checked) =>
              setPreferredMode(checked ? "venta" : "alquiler")
            }
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-blue-600"
          />
          <Label
            htmlFor="mode-switch"
            className={`text-xs cursor-pointer ${preferredMode === "venta" ? "text-white font-bold" : "text-slate-400"}`}
          >
            Venta
          </Label>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0 px-4 pb-4 items-stretch">
        <div className="flex-1 flex flex-col bg-card border rounded-xl shadow-sm overflow-hidden min-h-0">
          <PosProductSection />
        </div>

        <div className="w-[400px] flex flex-col bg-card border rounded-xl shadow-md overflow-hidden min-h-0">
          <PosCartSection />
        </div>
      </div>
    </div>
  );
}
