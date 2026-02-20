"use client";

import { useMemo } from "react";
import { RentalsDataTable } from "./rentals-data-table";
import { useRentalStore } from "@/src/store/useRentalStore";
import { mapRentalToTable } from "@/src/adapters/rentals-active-adapters";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";

export const RentalsGrid = () => {
  const { rentals, rentalItems } = useRentalStore();
  const { products } = useInventoryStore();
  const { customers } = useCustomerStore();
  const { guarantees } = useGuaranteeStore();

  const allData = useMemo(
    () =>
      mapRentalToTable(customers, rentals, guarantees, rentalItems, products),
    [rentals, rentalItems, products, customers, guarantees],
  );

  const active = allData.filter((i) => i.status === "alquilado");
  const canceled = allData.filter((i) => i.status === "anulado");
  const history = allData.filter((i) => i.status === "devuelto");
  const pending = allData.filter((i) => i.status === "reservado_fisico");

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col">
          <RentalsDataTable
            dataRentalPending={pending}
            dataRentalActive={active}
            dataRentalCanceled={canceled}
            dataRentalHistory={history}
          />
        </div>
      </div>
    </div>
  );
};
