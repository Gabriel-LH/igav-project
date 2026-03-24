"use client";

import { useMemo } from "react";
import { RentalsDataTable } from "./rentals-data-table";
import { RentalTableRow } from "@/src/adapters/rentals-active-adapters";

interface RentalsGridProps {
  initialData: RentalTableRow[];
}

export const RentalsGrid = ({ initialData }: RentalsGridProps) => {
  const active = useMemo(() => initialData.filter((i) => i.status === "alquilado"), [initialData]);
  const canceled = useMemo(() => initialData.filter((i) => i.status === "anulado"), [initialData]);
  const history = useMemo(() => initialData.filter((i) => i.status === "devuelto"), [initialData]);
  const pending = useMemo(() => initialData.filter((i) => i.status === "reservado_fisico"), [initialData]);

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
