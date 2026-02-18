'use client'

import { ClientDataTable } from "./client-data-table";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { mapClientToTable } from "@/src/adapters/client-adapters";

export function ClientLayout() {
  const { customers } = useCustomerStore();
  const dataClientActive = mapClientToTable(customers.filter(c => c.status === 'active'));
  const dataClientInactive = mapClientToTable(customers.filter(c => c.status === 'inactive'));

  return (
    <div>
      <ClientDataTable
        dataClientActive={dataClientActive}
        dataClientInactive={dataClientInactive}
      />
    </div>
  );
}