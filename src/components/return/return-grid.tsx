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

  console.log("Items en la calle que llega al return grid:", itemsInStreet);

  console.log("Rentals que llega al return grid:", rentals);

  console.log("Guarantees que llega al return grid:", guarantees);

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
        {itemsInStreet.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-400">
            No hay devoluciones pendientes.
          </div>
        )}

        {itemsInStreet.map((item) => {
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
            items: [
              {
                productId: item.productId,
                stockId: item.stockId,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                priceAtMoment: item.priceAtMoment,
                productName: productInfo?.name || "Vestido",
              },
            ],
            type: "alquiler",

            // 3. Reconstrucción de Financials (Lo que faltaba)
            financials: {
              totalRent: item.priceAtMoment, // Guardado en el RentalItem
              paymentMethod: "cash", // Como no se guarda en el Rental, puedes poner un default o extender el Rental type
              guarantee: {
                type: (realGuarantee?.type as any) || "otros",
                value: String(realGuarantee?.value || "0"),
                description: realGuarantee?.description || "Sin descripción",
              },
              receivedAmount: 0,
              keepAsCredit: false
            },
            updatedAt: new Date(),
          };

          return (
            <div key={`grid-item-${item.id}`}>
              <ReturnActionCard rental={rentalUnified as RentalDTO} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
