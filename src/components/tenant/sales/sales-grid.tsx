"use client";

import { useMemo } from "react";
import { SalesDataTable } from "./sales-data-table";
import { SaleTableRow } from "@/src/adapters/sales-table-adapter";

interface SalesGridProps {
  initialData: SaleTableRow[];
}

export const SalesGrid = ({ initialData }: SalesGridProps) => {
  const pending = useMemo(() => initialData.filter((i) => i.status === "vendido_pendiente_entrega"), [initialData]);
  const canceled = useMemo(() => initialData.filter((i) => i.status === "cancelado"), [initialData]);
  const returned = useMemo(() => initialData.filter((i) => i.status === "devuelto"), [initialData]);
  const history = useMemo(() => initialData.filter((i) => i.status === "vendido"), [initialData]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col">
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
