"use client";

import { useState } from "react";
import { useBarcodeScanner } from "@/src/hooks/useBarcodeScanner";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useCartStore } from "@/src/store/useCartStore";
import { toast } from "sonner";
import { PosProductSection } from "./pos-product-section";
import { PosCartSection } from "./pos-cart-section";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/badge";

export function PosLayout() {
  const { products, stock } = useInventoryStore();
  const { addItem, items } = useCartStore();

  // "Modo Preferido": Sirve solo cuando hay ambigüedad (cuando el producto puede ser ambas cosas)
  const [preferredMode, setPreferredMode] = useState<"venta" | "alquiler">(
    "alquiler",
  );

  useBarcodeScanner({
    onScan: (code) => {
      console.log("Escaneado:", code);

      // 1. BUSCAR EN STOCK (Prioridad: ID Único / Etiqueta física)
      // Nota: Tu schema tiene 'id', no 'stock_code'. Usamos 'id' como el código de barras único.
      const stockItem = stock.find((s) => s.id === code);

      let productToAdd = null;
      let operationMode: "venta" | "alquiler" = preferredMode; // Por defecto usamos la preferencia
      let specificStockId = undefined;

      if (stockItem) {
        // --- CASO 1: ES UN ÍTEM FÍSICO ESPECÍFICO (SERIAL O LOTE ESPECÍFICO) ---

        // Validar estado físico
        if (stockItem.status !== "disponible") {
          toast.error(
            `Este ítem no está disponible. Estado: ${stockItem.status}`,
          );
          return;
        }

        productToAdd = products.find((p) => p.id === stockItem.productId);
        specificStockId = stockItem.id;

        // --- AUTO-DETECCIÓN DE OPERACIÓN ---
        if (stockItem.isForSale && !stockItem.isForRent) {
          operationMode = "venta"; // Solo sirve para venta -> Forzamos venta
        } else if (!stockItem.isForSale && stockItem.isForRent) {
          operationMode = "alquiler"; // Solo sirve para alquiler -> Forzamos alquiler
        } else if (stockItem.isForSale && stockItem.isForRent) {
          // Sirve para ambos -> Usamos el preferredMode
          operationMode = preferredMode;
        } else {
          toast.error(
            "Este ítem está marcado como NO disponible para venta ni alquiler.",
          );
          return;
        }
      } else {
        // --- CASO 2: ES UN SKU GENÉRICO (PRODUCTO) ---
        productToAdd = products.find((p) => p.sku === code);

        if (productToAdd) {
          // Validar capacidades del producto
          if (productToAdd.can_sell && !productToAdd.can_rent) {
            operationMode = "venta";
          } else if (!productToAdd.can_sell && productToAdd.can_rent) {
            operationMode = "alquiler";
          } else {
            operationMode = preferredMode;
          }
        }
      }

      if (!productToAdd) {
        toast.error(`Código no encontrado: ${code}`);
        return;
      }

      // 2. VALIDACIONES DE SEGURIDAD
      // Validar si el producto permite la operación detectada
      if (operationMode === "venta" && !productToAdd.can_sell) {
        toast.warning(`El producto ${productToAdd.name} no permite VENTA`);
        return;
      }
      if (operationMode === "alquiler" && !productToAdd.can_rent) {
        toast.warning(`El producto ${productToAdd.name} no permite ALQUILER`);
        return;
      }

      // 3. CALCULAR STOCK DISPONIBLE REAL
      // Filtramos el stock que coincida con el modo detectado
      const availableStock = stock.filter(
        (s) =>
          s.productId === productToAdd!.id &&
          s.status === "disponible" &&
          (operationMode === "venta" ? s.isForSale : s.isForRent),
      );

      const maxStock = availableStock.reduce(
        (acc, curr) => acc + curr.quantity,
        0,
      );

      // 4. VALIDAR CARRITO ACTUAL
      const currentInCart =
        items.find(
          (i) =>
            i.product.id === productToAdd!.id &&
            i.operationType === operationMode,
        )?.quantity || 0;

      if (currentInCart >= maxStock) {
        toast.error(
          `Stock insuficiente para ${operationMode}. Quedan: ${maxStock}`,
        );
        return;
      }

      // Validar duplicidad de serial específico
      if (specificStockId) {
        const isSerialInCart = items.some((i) =>
          i.selectedStockIds.includes(specificStockId!),
        );
        if (isSerialInCart) {
          toast.error("Este ítem específico ya está en el carrito.");
          return;
        }
      }
      const scannedVariant = {
        size: stockItem?.size,
        color: stockItem?.color,
      };

      // 5. AGREGAR AL CARRITO
      addItem(
        productToAdd,
        operationMode,
        specificStockId,
        maxStock,
        scannedVariant,
      );

      // Mensaje inteligente
      const modeLabel = operationMode === "venta" ? "VENTA" : "ALQUILER";
      // Si el modo forzado fue diferente al preferido, avisamos
      if (operationMode !== preferredMode) {
        toast.info(`Agregado como ${modeLabel} (Restricción del ítem)`);
      } else {
        toast.success(`${productToAdd.name} agregado`);
      }
    },
  });

  return (
    <div className="flex flex-col h-full gap-2">
      {/* BARRA SUPERIOR: MODO POR DEFECTO */}
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

      <div className="flex flex-1 gap-4 min-h-0 px-4 pb-4">
        {/* IZQUIERDA: Catálogo Manual */}
        <div className="flex-1 flex flex-col bg-card border rounded-xl shadow-sm overflow-hidden">
          <PosProductSection />
        </div>

        {/* DERECHA: Carrito */}
        <div className="w-[400px] flex flex-col bg-card border rounded-xl shadow-md overflow-hidden">
          <PosCartSection />
        </div>
      </div>
    </div>
  );
}
