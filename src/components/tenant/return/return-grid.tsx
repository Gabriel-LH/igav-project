"use client";

import { useRentalStore } from "@/src/store/useRentalStore";
import { ReturnActionCard } from "./return-action-card";
import { ReturnStats } from "./return-stats";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
import { RentalDTO } from "@/src/application/dtos/RentalDTO";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { useState, useCallback } from "react";
import { useBarcodeScanner } from "@/src/hooks/useBarcodeScanner";
import { Input } from "@/components/input";
import { Barcode, Scan } from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { BarcodeScanner } from "../inventory/inventory/barcode/Scanner";
import { Button } from "@/components/button";

interface Props {
  attributeTypes?: any[];
  attributeValues?: any[];
}

export const ReturnGrid = ({ attributeTypes = [], attributeValues = [] }: Props) => {
  const { rentals, rentalItems } = useRentalStore();
  const { guarantees } = useGuaranteeStore();
  const [openRentalId, setOpenRentalId] = useState<string | null>(null);
  const [activeScanCode, setActiveScanCode] = useState<string | undefined>();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleGlobalScan = useCallback((code: string) => {
    // 1. Buscar el item en toda la data de alquileres activos
    const item = rentalItems.find(
      (i) => i.serialCode === code || i.stockId === code || String(i.id) === code
    );

    if (item) {
      setOpenRentalId(item.rentalId);
      setActiveScanCode(code);
      toast.success(`Alquiler detectado para: ${code}`);
    } else {
      toast.error(`No se encontró ningún alquiler activo con el código: ${code}`);
    }
  }, [rentalItems]);

  useBarcodeScanner({ onScan: handleGlobalScan });

  const { products, productVariants } = useInventoryStore();

  const { customers } = useCustomerStore();

  // 1. Ítems que están físicamente con el cliente
  const itemsInStreet = rentalItems.filter(
    (item) => item.itemStatus === "alquilado",
  );

  // Group items by rentalId + productId
  const groupedItems = itemsInStreet.reduce(
    (acc, item) => {
      const key = `${item.rentalId}-${item.productId}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, typeof itemsInStreet>,
  );

  const today = new Date().setHours(0, 0, 0, 0);

  // 2. Estadísticas (cruzando con Rental padre)
  const overdue = itemsInStreet.filter((item) => {
    const parent = rentals.find((r) => r.id === item.rentalId);
    return (
      parent && new Date(parent.expectedReturnDate).setHours(0, 0, 0, 0) < today
    );
  });

  const dueToday = itemsInStreet.filter((item) => {
    const parent = rentals.find((r) => r.id === item.rentalId);
    return (
      parent &&
      new Date(parent.expectedReturnDate).setHours(0, 0, 0, 0) === today
    );
  });

  return (
    <div className="w-full space-y-4">
      {/* BARRA DE ESCANEO GLOBAL */}
      <div className=" px-2 py-1 rounded-2xl shadow-xl border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-white font-black text-sm uppercase tracking-[0.2em] mb-1">
              Escanear Producto
            </h2>
            <p className="text-slate-400 text-[10px] font-medium uppercase truncate">
              Escanea una prenda para procesar su devolución al instante
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-[400px]">
              <Input
                placeholder="Escanea o escribe código de prenda..."
                className="text-white pl-10 h-12 rounded-xl  text-xs font-bold w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGlobalScan((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            </div>

            <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="secondary" 
                  className="h-12 w-12 rounded-xl bg-slate-800 border-slate-700 hover:bg-slate-700 text-white shadow-lg"
                  title="Escanear con cámara"
                >
                  <Scan size={20} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Escáner de Cámara</DialogTitle>
                  <DialogDescription>
                    Enfoca el código de barras o QR de la prenda para abrir el alquiler.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <BarcodeScanner 
                    onScan={(code) => {
                      handleGlobalScan(code);
                      setIsCameraOpen(false);
                    }}
                    autoStopOnScan={true}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <ReturnStats dueToday={dueToday} overdue={overdue} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(groupedItems).length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-400">
            No hay devoluciones pendientes.
          </div>
        )}

        {Object.values(groupedItems).map((group) => {
          const item = group[0]; // Representative item
          // Rental padre
          const parent = rentals.find((r) => r.id === item.rentalId);

          const productInfo = products.find((p) => p.id === item.productId);

          const customerInfo = customers.find(
            (c) => c.id === parent?.customerId,
          );

          const realGuarantee = guarantees.find(
            (g) => g.id === parent?.guaranteeId || g.operationId === parent?.operationId,
          );
          if (!parent) return null;

          // 3. Unificamos todo en el DTO que el Drawer espera
          const rentalUnified: RentalDTO = {
            // 1. Datos del Padre (Rental)
            id: parent.id,
            customerId: parent.customerId,
            customerName: customerInfo?.firstName || "Cliente",
            branchId: parent.branchId,
            startDate: new Date(parent.outDate),
            endDate: new Date(parent.expectedReturnDate),
            status: parent.status as any,
            notes: parent.notes || "",
            createdAt: new Date(parent.createdAt),
            operationId: parent.operationId || "",
            policySnapshot: (parent as any).policySnapshot,
            sellerId: "",
            items: group.map((gItem) => ({
              id: gItem.id, // ID del RentalItem
              productId: gItem.productId,
              stockId: gItem.stockId,
              sizeId: (gItem as any).sizeId || (gItem as any).size || productVariants.find(v => v.id === gItem.variantId)?.attributes?.["talla"] || (productVariants.find(v => v.id === gItem.variantId)?.attributes as any)?.["size"] || "N/A",
              colorId: (gItem as any).colorId || (gItem as any).color || productVariants.find(v => v.id === gItem.variantId)?.attributes?.["color"] || "N/A",
              variantAttributes: (() => {
                const variant = productVariants.find((v) => v.id === gItem.variantId);
                const resolved: Record<string, string> = {};
                if (variant && variant.attributes) {
                  Object.entries(variant.attributes).forEach(([key, value]) => {
                    const type = attributeTypes.find(
                      (t) =>
                        String(t.id) === String(key) ||
                        t.name.toLowerCase() === String(key).toLowerCase() ||
                        t.code.toLowerCase() === String(key).toLowerCase()
                    );
                    const keyName = type?.name || String(key);

                    const val = attributeValues.find(
                      (v) =>
                        String(v.id) === String(value) ||
                        v.value.toLowerCase() === String(value).toLowerCase() ||
                        v.code.toLowerCase() === String(value).toLowerCase()
                    );
                    const valName = val?.value || String(value);
                    resolved[keyName] = valName;
                  });
                }
                return resolved;
              })(),
              quantity: gItem.quantity, // Should be 1 per item usually
              priceAtMoment: gItem.priceAtMoment,
              productName: productInfo?.name || "Vestido",
              serialCode: gItem.serialCode,
              isSerial: gItem.isSerial,
            })),
            type: "alquiler",

            // 3. Reconstrucción de Financials
            financials: {
              subtotal: group.reduce((sum, i) => sum + i.priceAtMoment, 0),
              totalDiscount: 0,
              totalAmount:
                Number((parent as any).operationTotalAmount) ||
                group.reduce((sum, i) => sum + i.priceAtMoment, 0),
              paymentMethod: "cash",
              receivedAmount: 0,
              keepAsCredit: false,
            },
            guarantee: {
              type: (realGuarantee?.type as any) || "otros",
              value: String(realGuarantee?.value || "0"),
              description: realGuarantee?.description || "Sin descripción",
            },
            updatedAt: new Date(),
          } as any;

          return (
            <div key={`grid-group-${item.rentalId}-${item.productId}`}>
              <ReturnActionCard 
                rental={rentalUnified} 
                forceOpen={openRentalId === rentalUnified.id}
                initialScanCode={openRentalId === rentalUnified.id ? activeScanCode : undefined}
                onClose={() => {
                  setOpenRentalId(null);
                  setActiveScanCode(undefined);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
