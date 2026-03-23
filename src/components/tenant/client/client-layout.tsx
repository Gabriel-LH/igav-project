"use client";

import { useEffect, useState } from "react";
import { ClientDataTable } from "./client-data-table";
import { mapClientToTable } from "@/src/adapters/client-adapters";
import { getClientsAction } from "@/src/app/(tenant)/tenant/actions/client.actions";
import { getCouponsByClientIdsAction } from "@/src/app/(tenant)/tenant/actions/coupon.actions";
import { toast } from "sonner";
import { Client } from "@/src/types/clients/type.client";
import { Coupon } from "@/src/types/coupon/type.coupon";

export function ClientLayout() {
  const [customers, setCustomers] = useState<Client[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadClients = async () => {
      const result = await getClientsAction();
      if (cancelled) return;

      if (!result.success || !result.data) {
        toast.error(result.error || "No se pudieron cargar los clientes");
        return;
      }

      setCustomers(result.data);

      const clientIds = result.data.map((client) => client.id);
      const couponsResult = await getCouponsByClientIdsAction(clientIds);
      if (cancelled) return;

      if (!couponsResult.success || !couponsResult.data) {
        toast.error(couponsResult.error || "No se pudieron cargar los cupones");
        return;
      }

      setCoupons(couponsResult.data);
    };

    loadClients();

    return () => {
      cancelled = true;
    };
  }, []);
  
  const dataClientActive = mapClientToTable(
    customers.filter((c) => c.status === "active"),
    coupons,
  );
  const dataClientInactive = mapClientToTable(
    customers.filter((c) => c.status === "inactive"),
    coupons,
  );

  const dataClientAll = mapClientToTable(customers, coupons);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col md:gap-4 md:py-4">
          <ClientDataTable
            dataClientActive={dataClientActive}
            dataClientInactive={dataClientInactive}
            dataClientAll={dataClientAll}
            onClientCreated={(client) => {
              setCustomers((current) => [client, ...current]);
            }}
          />
        </div>
      </div>
    </div>
  );
}
