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

  console.log("Sales", sales);
  console.log("SaleItems", saleItems);
  console.log("Products", products);
  console.log("Customers", customers);

  const allData = useMemo(
    () => mapSaleToTable(customers, sales, saleItems, products),
    [sales, saleItems, products, customers],
  );

  console.log("Todos los datos que llegan al grid",allData);

  const pending = allData.filter((i) => i.status === "vendido_pendiente_entrega");
  const canceled = allData.filter((i) => i.status === "cancelado");
  const returned = allData.filter((i) => i.status === "devuelto");
  const history = allData.filter((i) => i.status === "vendido");

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col">
          {/* <RentalsTab /> */}
          <SalesDataTable
            dataSalesPending={pending}
            dataSalesCanceled={canceled}
            dataSalesReturn={returned}
            dataSalesHistory={history}
          />
        </div>
      </div>
    </div>
  );
};
