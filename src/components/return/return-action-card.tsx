import { Card } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarCheckIn01Icon,
  AlertCircleIcon,
  UserIcon,
  ColorsIcon,
  Money03Icon,
  Information,
  ShoppingBag02Icon,
} from "@hugeicons/core-free-icons";
import { formatCurrency } from "@/src/utils/currency-format";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { ReturnInspectionDrawer } from "./return-inspector-action";
import { RentalDTO } from "@/src/interfaces/RentalDTO";

interface Props {
  rental: RentalDTO;
}

export function ReturnActionCard({ rental }: Props) {
  // 1. HIDRATACIÓN: Buscamos al cliente
  const client = CLIENTS_MOCK.find((c) => c.id === rental.customerId);

  const guarantee = rental.guarantee;

  console.log("garantia que llega al return action card", guarantee);

  // 3. LÓGICA DE MORA (Profesional: Comparando solo fechas sin horas)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(rental.endDate);
  dueDate.setHours(0, 0, 0, 0);

  const isOverdue = today > dueDate;
  const diffTime = Math.abs(today.getTime() - dueDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300">
      {/* HEADER DINÁMICO */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 text-[10px] font-black uppercase tracking-widest ${
          isOverdue ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
        }`}
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            strokeWidth={3}
            icon={isOverdue ? AlertCircleIcon : CalendarCheckIn01Icon}
            size={14}
          />
          {isOverdue
            ? `MORA DETECTADA (+${diffDays} DÍAS)`
            : "DENTRO DEL PLAZO"}
        </div>
        <span className="bg-white/20 px-2 py-0.5 rounded text-[9px]">
          Expira: {dueDate.toLocaleDateString("es-PE")}
        </span>
      </div>

      <div className="px-4 space-y-3">
        {/* SECCIÓN CLIENTE */}
        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50">
          <div className="bg-primary/10 text-primary p-2.5 rounded-full">
            <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">
              Titular del Alquiler
            </p>
            <p className="font-bold text-sm text-foreground">
              {client
                ? `${client.firstName} ${client.lastName}`
                : (rental as any).customerName}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              DNI {client?.dni || "---"} • {client?.phone || "Sin teléfono"}
            </p>
          </div>
        </div>

        {/* SECCIÓN GARANTÍA (Lo que te preocupaba) */}
        <div
          className={`group flex items-center gap-3 p-3 rounded-xl border transition-colors ${
            guarantee && guarantee.type !== "no_aplica"
              ? "bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-500/20"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div
            className={`p-2 rounded-lg ${guarantee && guarantee.type !== "no_aplica" ? "text-amber-600 bg-amber-100" : "text-slate-400 bg-slate-100"}`}
          >
            <HugeiconsIcon icon={Money03Icon} size={18} />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">
              Garantía en Custodia
            </p>
            <div className="text-xs font-bold uppercase truncate">
              {guarantee && guarantee.type !== "no_aplica" ? (
                guarantee.type === "dinero" ? (
                  <span className="text-amber-700 dark:text-amber-500 flex items-center gap-1">
                    Efectivo: {formatCurrency(Number(guarantee.value))}
                  </span>
                ) : (
                  <span className="text-blue-700 dark:text-blue-400">
                    {guarantee.type}: {guarantee.description || guarantee.value}
                  </span>
                )
              ) : (
                <span className="text-red-500 italic">
                  Sin garantía registrada
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN PRODUCTO */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <HugeiconsIcon
              icon={ShoppingBag02Icon}
              size={12}
              strokeWidth={2}
              className="text-muted-foreground"
            />
            <p className="text-[10px] font-black text-muted-foreground uppercase">
              Detalle de Prenda
            </p>
          </div>
          <div className="flex items-center justify-between bg-accent/40 rounded-lg p-3 border border-border/40">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-tight">
                {rental.items?.[0]?.productName || "Producto"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Total:{" "}
                {rental.items?.reduce((acc, curr) => acc + curr.quantity, 0) ||
                  0}{" "}
                unid.
              </span>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-background border rounded text-[10px] font-bold flex items-center gap-1">
                <HugeiconsIcon icon={Information} size={12} strokeWidth={2} />
                {(() => {
                  const sizes = Array.from(
                    new Set(
                      rental.items?.map(
                        (i) => (i as any).sizeId || (i as any).size,
                      ),
                    ),
                  );
                  return sizes.length === 1 ? `Talla ${sizes[0]}` : "Mixto";
                })()}
              </span>
              <span className="px-2 py-1 bg-background border rounded text-[10px] font-bold flex items-center gap-1">
                <HugeiconsIcon icon={ColorsIcon} size={12} strokeWidth={2} />
                {(() => {
                  const colors = Array.from(
                    new Set(
                      rental.items?.map(
                        (i) => (i as any).colorId || (i as any).color,
                      ),
                    ),
                  );
                  return colors.length === 1 ? colors[0] : "Mixto";
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* BOTÓN DE ACCIÓN */}
        <div className="py-2">
          <ReturnInspectionDrawer
            rental={rental}
            client={client}
            isOverdue={isOverdue}
          />
        </div>
      </div>
    </Card>
  );
}
