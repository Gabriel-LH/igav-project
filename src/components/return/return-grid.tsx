"use client";

import { useRentalStore } from "@/src/store/useRentalStore";
import { ReturnActionCard } from "./return-action-card";
import { ReturnStats } from "./return-stats";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
import { RentalDTO } from "@/src/interfaces/RentalDTO";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useCustomerStore } from "@/src/store/useCustomerStore";

export const ReturnGrid = () => {
  const { rentals, rentalItems } = useRentalStore();
  const { guarantees } = useGuaranteeStore(); // Added missing semicolon

  const { products } = useInventoryStore();

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
      {/* Estadísticas (una sola vez) */}
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
            (g) => g.id === parent?.guaranteeId,
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
            sellerId: "",
            items: group.map((gItem) => ({
              id: gItem.id, // ID del RentalItem
              productId: gItem.productId,
              stockId: gItem.stockId,
              sizeId: (gItem as any).sizeId || (gItem as any).size,
              colorId: (gItem as any).colorId || (gItem as any).color,
              quantity: gItem.quantity, // Should be 1 per item usually
              priceAtMoment: gItem.priceAtMoment,
              productName: productInfo?.name || "Vestido",
            })),
            type: "alquiler",

            // 3. Reconstrucción de Financials
            financials: {
              subtotal: group.reduce((sum, i) => sum + i.priceAtMoment, 0),
              totalDiscount: 0,
              totalAmount: group.reduce((sum, i) => sum + i.priceAtMoment, 0),
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
              <ReturnActionCard rental={rentalUnified} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
