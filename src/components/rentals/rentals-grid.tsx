"use client";

import { useMemo } from "react";
import { RentalsDataTable } from "./rentals-data-table";
import { RentalsTab } from "./rentals-tab";
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

  const allData = useMemo(() => mapRentalToTable(customers, rentals, guarantees, rentalItems, products), [rentals, rentalItems, products, customers, guarantees]);

  const active = allData.filter(i => i.status === "alquilado");

  console.log("Informacion completa del rental activo", allData);
  const dataRentalCanceled = [];
  const dataRentalHistory = [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <RentalsTab />
          <RentalsDataTable
            dataRentalActive={active}
            dataRentalCanceled={dataRentalCanceled}
            dataRentalHistory={dataRentalHistory}
          />
        </div>
      </div>
    </div>
  );
};
