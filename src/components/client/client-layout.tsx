"use client";

import { ClientDataTable } from "./client-data-table";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { mapClientToTable } from "@/src/adapters/client-adapters";

export function ClientLayout() {
  const { customers } = useCustomerStore();
  const dataClientActive = mapClientToTable(
    customers.filter((c) => c.status === "active"),
  );
  const dataClientInactive = mapClientToTable(
    customers.filter((c) => c.status === "inactive"),
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col md:gap-4 md:py-4">
          <ClientDataTable
            dataClientActive={dataClientActive}
            dataClientInactive={dataClientInactive}
          />
        </div>
      </div>
    </div>
  );
}
