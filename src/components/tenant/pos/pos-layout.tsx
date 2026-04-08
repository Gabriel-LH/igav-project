"use client";

import { useEffect, useState } from "react";
import { useBarcodeScanner } from "@/src/hooks/useBarcodeScanner";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { GLOBAL_BRANCH_ID } from "@/src/store/useBranchStore";
import { useCartStore } from "@/src/store/useCartStore";
import { toast } from "sonner";
import { PosProductSection } from "./pos-product-section";
import { PosCartSection } from "./pos-cart-section";
import { BarcodeScanner } from "../inventory/inventory/barcode/Scanner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/drawer";
import { FeatureGuard } from "@/src/components/tenant/guards/FeatureGuard";
import { useInventorySync } from "@/src/hooks/inventory/useInventorySync";
import { useTenantConfigStore } from "@/src/store/useTenantConfigStore";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { formatCurrency } from "@/src/utils/currency-format";
import { ScanLine, ShoppingCart } from "lucide-react";

export function PosLayout() {
  const { products, inventoryItems, stockLots } = useInventoryStore();
  const { selectedBranchId } = useInventorySync();
  const isMobile = useIsMobile();

  // Use selectors for stability and to prevent unnecessary re-renders
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const getTotal = useCartStore((s) => s.getTotal);
  const ensureLoaded = useTenantConfigStore((s) => s.ensureLoaded);

  const [preferredMode, setPreferredMode] = useState<"venta" | "alquiler">(
    "alquiler",
  );
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [scannerDrawerOpen, setScannerDrawerOpen] = useState(false);

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = getTotal();

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  // The promotion calculation is now handled internally by the store actions
  // (addItem, removeItem, updateQuantity, etc.), so we remove the reactive effect.

  const handleScannedCode = useState(() => (code: string) => {
    if (!selectedBranchId || selectedBranchId === GLOBAL_BRANCH_ID) {
      toast.error("Selecciona una sucursal para usar el POS.");
      return;
    }
    console.log("Escaneado:", code);

    // 1. BUSCAR EN INVENTARIO (Seriales o Lotes)
    const serialItem = inventoryItems.find((i) => i.serialCode === code);
    const lotItem = stockLots.find((l) => l.variantId === code); // fallback to variantCode for now if used as SKU

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
      scannedVariant = { variantId: serialItem.variantId };

      if (serialItem.isForSale && !serialItem.isForRent)
        operationMode = "venta";
      else if (!serialItem.isForSale && serialItem.isForRent)
        operationMode = "alquiler";
      else operationMode = preferredMode;

      maxStock = inventoryItems.filter(
        (i) =>
          i.productId === serialItem.productId &&
          i.variantId === serialItem.variantId &&
          i.status === "disponible" &&
          (operationMode === "venta" ? i.isForSale : i.isForRent),
      ).length;
    } else if (lotItem) {
      // --- CASO 2: LOTE ---
      if (lotItem.status !== "disponible" || lotItem.quantity <= 0) {
        toast.error("Este lote está agotado.");
        return;
      }

      productToAdd = products.find((p) => p.id === lotItem.productId);
      specificCode = lotItem.id; // 🔥 Usamos UUID
      scannedVariant = { variantId: lotItem.variantId };

      if (lotItem.isForSale && !lotItem.isForRent) operationMode = "venta";
      else if (!lotItem.isForSale && lotItem.isForRent)
        operationMode = "alquiler";
      else operationMode = preferredMode;

      maxStock = lotItem.quantity;
    } else {
      // --- CASO 3: SKU GENÉRICO DE PRODUCTO ---
      productToAdd = products.find((p) => p.baseSku === code);
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
          (!scannedVariant || i.variantId === scannedVariant.variantId),
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
      scannedVariant?.variantId,
    );

    const modeLabel = operationMode === "venta" ? "VENTA" : "ALQUILER";
    if (operationMode !== preferredMode) {
      toast.info(`Agregado como ${modeLabel} (Restricción del ítem)`);
    } else {
      toast.success(`${productToAdd.name} agregado`);
    }
  })[0];

  useBarcodeScanner({
    onScan: handleScannedCode,
  });

  const mobileActionButtons = (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="h-9 flex-1 gap-2 border-0 bg-white/10 text-white hover:bg-white/20 md:w-auto md:flex-none"
        onClick={() => setScannerDrawerOpen(true)}
      >
        <ScanLine className="h-4 w-4" />
        <span className="text-xs font-semibold">Escanear</span>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="h-9 flex-1 gap-2 border-0 bg-white/10 text-white hover:bg-white/20 md:w-auto md:flex-none"
        onClick={() => setCartDrawerOpen(true)}
      >
        <ShoppingCart className="h-4 w-4" />
        <span className="text-xs font-semibold">
          Carrito
          {cartItemsCount > 0 ? ` (${cartItemsCount})` : ""}
        </span>
        {cartItemsCount > 0 && (
          <span className="text-[11px] text-slate-200">
            {formatCurrency(cartTotal)}
          </span>
        )}
      </Button>
    </>
  );

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden gap-2">
      <div className="px-2 py-2 bg-slate-800 text-white rounded-lg mt-2 shadow-md">
        <div className="flex items-center justify-between">
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
            <FeatureGuard feature="rentals">
              <Label
                htmlFor="mode-switch"
                className={`text-xs cursor-pointer ${preferredMode === "alquiler" ? "text-white font-bold" : "text-slate-400"}`}
              >
                Alquiler
              </Label>
            </FeatureGuard>
            <FeatureGuard feature={["sales", "rentals"]} requireAll>
              <Switch
                id="mode-switch"
                checked={preferredMode === "venta"}
                onCheckedChange={(checked) =>
                  setPreferredMode(checked ? "venta" : "alquiler")
                }
                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-blue-600"
              />
            </FeatureGuard>
            <FeatureGuard feature="sales">
              <Label
                htmlFor="mode-switch"
                className={`text-xs cursor-pointer ${preferredMode === "venta" ? "text-white font-bold" : "text-slate-400"}`}
              >
                Venta
              </Label>
            </FeatureGuard>
          </div>
        </div>
      </div>

      {isMobile && <div className="flex gap-2">{mobileActionButtons}</div>}

      <div className="flex flex-1 gap-2 min-h-0  pb-4 items-stretch">
        <div className="flex-1 flex flex-col overflow-hidden">
          <PosProductSection />
        </div>

        <div className="hidden md:flex w-[400px] flex-col bg-card border rounded-xl shadow-md overflow-hidden min-h-0">
          <PosCartSection />
        </div>
      </div>

      {isMobile && (
        <>
          <Drawer
            open={scannerDrawerOpen}
            onOpenChange={setScannerDrawerOpen}
            direction="bottom"
          >
            <DrawerContent className="h-[70vh]">
              <DrawerHeader className="text-left">
                <DrawerTitle>Escaneo con cámara</DrawerTitle>
                <DrawerDescription>
                  Escanea varios productos seguidos desde el celular sin cerrar
                  el lector.
                </DrawerDescription>
              </DrawerHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                <BarcodeScanner
                  onScan={handleScannedCode}
                  autoStopOnScan={false}
                />
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer
            open={cartDrawerOpen}
            onOpenChange={setCartDrawerOpen}
            direction="bottom"
          >
            <DrawerContent className="h-[88vh]">
              <DrawerHeader className="text-left">
                <DrawerTitle className="sr-only">
                  Carrito {cartItemsCount > 0 ? `(${cartItemsCount})` : ""}
                </DrawerTitle>
                <DrawerDescription className="sr-only">
                  Revisa productos, descuentos y cobro sin tapar el catálogo.
                </DrawerDescription>
              </DrawerHeader>
              <div className="min-h-0 -mt-8 flex-1 overflow-hidden">
                <PosCartSection />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </div>
  );
}
