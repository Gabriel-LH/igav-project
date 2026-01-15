// src/components/devoluciones/return-action-card.tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarCheckIn01Icon,
  AlertCircleIcon,
  PackageReceiveIcon,
  UserIcon,
  ColorPickerIcon,
  ColorsIcon,
} from "@hugeicons/core-free-icons";
import { formatCurrency } from "@/src/utils/currency-format";
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";
import { MOCK_RESERVATION_ITEM } from "@/src/mocks/mock.reservationItem";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { Reservation } from "@/src/types/reservation/type.reservation";
import { MOCK_GUARANTEE } from "@/src/mocks/mock.guarantee";
import { OPERATIONS_MOCK } from "@/src/mocks/mock.operation";
import { ReturnInspectionDrawer } from "./return-inspector-action";

interface Props {
  reservation: Reservation;
}

export function ReturnActionCard({ reservation }: Props) {
  const client = CLIENTS_MOCK.find((c) => c.id === reservation.customerId);
  const items = MOCK_RESERVATION_ITEM.filter(
    (i) => i.reservationId === reservation.id
  );
  const operation = OPERATIONS_MOCK.find(
    (op) => op.reservationId === reservation.id
  );

  const guaranteeRecord = MOCK_GUARANTEE.find(
    (g) => g.operationId === operation?.id
  );

  // Lógica de Mora
  const today = new Date();
  const dueDate = new Date(reservation.endDate);
  const isOverdue =
    today > dueDate && today.toDateString() !== dueDate.toDateString();

  // Calcular días de retraso
  const diffTime = Math.abs(today.getTime() - dueDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;

  return (
    <Card className={`overflow-hidden transition-all`}>
      {/* HEADER */}
      <div
        className={`flex items-center justify-between px-4 py-2 text-[10px] font-black uppercase tracking-wide ${
          isOverdue ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
        }`}
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={isOverdue ? AlertCircleIcon : CalendarCheckIn01Icon}
            size={14}
          />
          {isOverdue ? `Cliente en mora (+${diffDays} días)` : "Plazo vigente"}
        </div>
        <span className="opacity-90">
          Vence: {dueDate.toLocaleDateString("es-PE")}
        </span>
      </div>

      {/* BODY */}
      <div className="px-4 grid grid-cols-1 gap-6">
        {/* CLIENTE + GARANTÍA */}
        <div className="space-y-3">
          {/* Cliente */}
          <div className="flex gap-3  border bg-accent rounded-lg p-3">
            <div className="rounded-md p-2">
              <HugeiconsIcon icon={UserIcon} size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase">Cliente</p>
              <p className="font-bold text-blue-600 leading-tight">
                {client?.firstName} {client?.lastName}
              </p>
              <div className="flex gap-2">
                <p className="text-xs text-muted-foreground">{client?.phone}</p>
                <p className="text-xs text-muted-foreground">
                  • DNI {client?.dni}
                </p>
              </div>
            </div>
          </div>

          {/* Garantía */}
          <div
            className={`rounded-lg border p-3 ${
              guaranteeRecord
                ? "bg-amber-100/10 border-amber-700/20"
                : "bg-red-100/10 border-red-700/20"
            }`}
          >
            <p className="text-[9px] font-black uppercase text-emerald-400">
              Garantía en resguardo
            </p>
            <p className="text-sm font-black ">
              {guaranteeRecord
                ? guaranteeRecord.type === "efectivo"
                  ? formatCurrency(guaranteeRecord.value)
                  : guaranteeRecord.description
                : "FALTA GARANTÍA"}
            </p>
          </div>
        </div>

        {/* PRENDAS */}
        <div className="md:col-span-2">
          <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">
            Prendas a recuperar
          </p>

          <div className="grid grid-cols-1  sm:grid-cols-2 gap-2">
            {items.map((item) => {
              const p = PRODUCTS_MOCK.find(
                (prod) => prod.id === item.productId
              );

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 bg-accent rounded-md border px-3 py-2"
                >
                  <span className="text-[11px] font-medium truncate">
                    {p?.name}{" "}
                    <span className="text-blue-300">({item.size})</span>
                  </span>
                  <div className="w-px h-4 bg-slate-400" />
                  <span className="flex items-center gap-1 text-[11px] font-medium truncate">
                    <HugeiconsIcon icon={ColorsIcon} size={14} />
                    Color: {item.color}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACCIÓN */}
        <div className="flex w-full">
          <ReturnInspectionDrawer reservation={reservation} onClose={() => {}} isOverdue={isOverdue} />
        </div>
      </div>
    </Card>
  );
}
