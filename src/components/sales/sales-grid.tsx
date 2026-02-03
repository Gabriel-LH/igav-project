"use client";

import { useSaleStore } from "@/src/store/useSaleStore";
import { SalesDataTable } from "./sales-data-table";
import { useMemo } from "react";
import { mapSaleToTable } from "@/src/adapters/sales-table-adapter";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useCustomerStore } from "@/src/store/useCustomerStore";

export const SalesGrid = () => {

  const { sales, saleItems } = useSaleStore();

  const { products } = useInventoryStore();
  const { customers } = useCustomerStore();

  const allData = useMemo(
    () => mapSaleToTable(customers, sales, saleItems, products),
    [sales, saleItems, products, customers],
  );

  const pending = allData.filter((i) => i.status === "pendiente");
  const canceled = allData.filter((i) => i.status === "cancelado");
  const returned = allData.filter((i) => i.status === "devuelto");
  const history = allData.filter((i) => i.status === "completado");

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* <RentalsTab /> */}
          <SalesDataTable
            dataSalesPending={[]}
            dataSalesCanceled={[]}
            dataSalesReturn={[]}
            dataSalesHistory={history}
          />
        </div>
      </div>
    </div>
  );
};
