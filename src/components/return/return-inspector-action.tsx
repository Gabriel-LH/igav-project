// src/components/devoluciones/return-inspection-drawer.tsx
"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/button";
import { formatCurrency } from "@/src/utils/currency-format";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  Settings03Icon,
  AlertCircleIcon,
  Invoice01Icon,
  PackageReceiveIcon,
  CheckmarkBadge03Icon,
} from "@hugeicons/core-free-icons";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/drawer";
import { RiDeleteBin5Line } from "react-icons/ri";
import { GiSewingMachine } from "react-icons/gi";
import { PiWashingMachineFill } from "react-icons/pi";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { OPERATIONS_MOCK } from "@/src/mocks/mock.operation";
import { MOCK_GUARANTEE } from "@/src/mocks/mock.guarantee";
import { Badge } from "@/components/badge";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useReservationStore } from "@/src/store/useReservationStore";
import { MOCK_RESERVATION_ITEM } from "@/src/mocks/mock.reservationItem";
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";

export function ReturnInspectionDrawer({
  reservation,
  isOverdue,
  onClose,
}: {
  reservation: any;
  isOverdue: boolean;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const [extraDamageCharge, setExtraDamageCharge] = useState(0);
  const [damageNotes, setDamageNotes] = useState("");
  // Estados de inspección
  const [itemsStatus, setItemsStatus] = useState({
    allPartsPresent: false,
    noStains: true,
    noPhysicalDamage: true,
  });

  const updateStockStatus = useInventoryStore(
    (state) => state.updateStockStatus
  );
  const returnReservation = useReservationStore(
    (state) => state.returnReservation
  );

  // 1. Buscamos los items de la reserva
  const reservationItems = useMemo(
    () =>
      MOCK_RESERVATION_ITEM.filter((i) => i.reservationId === reservation.id),
    [reservation.id]
  );

  const [waivePenalty, setWaivePenalty] = useState(false); // Perdonar mora

  // 2. Estado para cada prenda: { stockId: "status" }
  const [itemsInspection, setItemsInspection] = useState<
    Record<string, string>
  >(
    Object.fromEntries(reservationItems.map((item) => [item.id, "lavanderia"]))
  );

  const counts = useMemo(() => {
    const stats = { lavanderia: 0, mantenimiento: 0, baja: 0, disponible: 0 };
    Object.values(itemsInspection).forEach(status => {
      stats[status as keyof typeof stats]++;
    });
    return stats;
  }, [itemsInspection]);


  // 1. Obtener la garantía real del sistema
  const guarantee = useMemo(() => {
    const op = OPERATIONS_MOCK.find((o) => o.reservationId === reservation.id);
    return MOCK_GUARANTEE.find((g) => g.operationId === op?.id);
  }, [reservation.id]);

  // 2. Lógica Financiera Adaptativa
  const summary = useMemo(() => {
    const today = new Date();
    const dueDate = new Date(reservation.endDate);

    // Mora
    const diffTime = today.getTime() - dueDate.getTime();
    const daysLate = Math.max(
      0,
      Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1
    );

    // Si waivePenalty es true, la mora es 0
    const penaltyAmount = waivePenalty ? 0 : daysLate * 15;
    const totalToPay = penaltyAmount + extraDamageCharge;

    // Si la garantía es efectivo, restamos. Si es objeto, sumamos deuda.
    const isCash = guarantee?.type === "efectivo";
    const guaranteeValue = isCash ? guarantee?.value || 0 : 0;

    return {
      isCash,
      daysLate,
      penaltyAmount,
      totalToPay,
      refundAmount: isCash ? Math.max(0, guaranteeValue - totalToPay) : 0,
      debtAmount: isCash
        ? totalToPay > guaranteeValue
          ? totalToPay - guaranteeValue
          : 0
        : totalToPay,
    };
  }, [reservation.endDate, waivePenalty, extraDamageCharge, guarantee]);

  // Mostrar inputs de multa si algo falla
  const showDamageInput =
    !itemsStatus.allPartsPresent ||
    !itemsStatus.noStains ||
    !itemsStatus.noPhysicalDamage;

  const handleCompleteReturn = () => {

    console.log("Iniciando proceso de retorno...");


    Object.entries(itemsInspection).forEach(([stockId, status]) => {
      updateStockStatus(stockId, status as any, damageNotes);
    });

    const totalExtra = summary.penaltyAmount + extraDamageCharge;
    returnReservation(reservation.id, totalExtra);
    onClose();
  };

  return (
    <>
      <Drawer
        direction={isMobile ? "bottom" : "right"}
        //open={isDrawerOpen}
        //onOpenChange={handleDrawerOpenChange}
      >
        <DrawerTrigger asChild>
          <Button
            className={`h-full min-h-[50px] w-full px-6  text-white transition-all ${
              isOverdue
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <HugeiconsIcon
              icon={PackageReceiveIcon}
              size={22}
              strokeWidth={2.2}
            />
            <span className="font-bold text-[12px] uppercase text-center leading-tight">
              Procesar retorno
            </span>
          </Button>
        </DrawerTrigger>

        <DrawerContent className={isMobile ? "" : "max-w-md ml-auto h-full"}>
          <DrawerHeader className="border-b">
            <DrawerTitle>Inspección de Retorno</DrawerTitle>
            <DrawerDescription>ID Reserva: {reservation.id}</DrawerDescription>
          </DrawerHeader>
          <div className="h-px bg-accent" />
          <div className="p-4 overflow-y-auto ">
            <section className="space-y-3">
              <h3 className="text-[12px] font-semibold uppercase tracking-widest">
                Inspección por prenda
              </h3>
              {reservationItems.map((item) => {
                const product = PRODUCTS_MOCK.find(
                  (p) => p.id === item.productId
                );
                return (
                  <div
                    key={item.id}
                    className="p-3 border rounded-xl bg-accent/50 space-y-3 mb-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">
                        {product?.name} ({item.size})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[
                        {
                          id: "lavanderia",
                          label: "Enviar a Lavar",
                          icon: <PiWashingMachineFill />,
                          activeColor: "bg-blue-100/10  text-blue-600",
                        },
                        {
                          id: "mantenimiento",
                          label: "Reparación",
                          icon: <GiSewingMachine />,
                          activeColor: "bg-amber-100/10  text-amber-600",
                        },
                        {
                          id: "baja",
                          label: "Dar de Baja",
                          icon: <RiDeleteBin5Line />,
                          activeColor: "bg-red-100/10  text-red-600",
                        },
                      ].map((opt) => {
                        const isSelected = itemsInspection[item.id] === opt.id;

                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              // Si hace clic en el que ya está seleccionado, se desmarca (vuelve a 'disponible')
                              const newStatus = isSelected
                                ? "disponible"
                                : opt.id;
                              setItemsInspection((prev) => ({
                                ...prev,
                                [item.id]: newStatus,
                              }));
                            }}
                            className={`flex-1 flex flex-col items-center p-2 cursor-pointer rounded-xl border transition-all ${
                              isSelected
                                ? opt.activeColor
                                : "opacity-50 hover:opacity-100"
                            }`}
                          >
                            <span className="text-lg">{opt.icon}</span>
                            <span className="text-[9px] italic pt-1 uppercase text-center leading-tight">
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3">
                Resumen Operativo
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {counts.lavanderia > 0 && (
                  <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                    <span>✨ {counts.lavanderia} a Lavandería</span>
                  </div>
                )}
                {counts.mantenimiento > 0 && (
                  <div className="flex items-center gap-2 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                    <span>🛠️ {counts.mantenimiento} a Reparación</span>
                  </div>
                )}
                {counts.baja > 0 && (
                  <div className="flex items-center gap-2 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                    <span>🗑️ {counts.baja} de Baja</span>
                  </div>
                )}
                {counts.disponible > 0 && (
                  <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    <span>✅ {counts.disponible} a Catálogo</span>
                  </div>
                )}
              </div>
            </section>

            {/* OPCIÓN PERDONAR MORA */}
            {summary.daysLate > 0 && (
              <div
                onClick={() => setWaivePenalty(!waivePenalty)}
                className="flex items-center justify-between p-3 mb-3 border border-dashed border-slate-600 rounded-xl cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={AlertCircleIcon}
                    className="text-red-500"
                    size={18}
                  />
                  <span className="text-xs font-bold text-red-500">
                    Perdonar mora acumulada
                  </span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    waivePenalty ? "bg-emerald-500" : "bg-accent"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                      waivePenalty ? "left-6" : "left-1"
                    }`}
                  />
                </div>
              </div>
            )}
            <div className="h-px bg-accent mb-2" />
            {/* SECCIÓN 1: CHECKLIST DE ESTADO */}
            <section className="space-y-4 mb-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-widest">
                Inspección Física
              </h3>

              <div className="grid gap-2">
                <InspectionToggle
                  label="Accesorios completos"
                  checked={itemsStatus.allPartsPresent}
                  onChange={(v) =>
                    setItemsStatus({ ...itemsStatus, allPartsPresent: v })
                  }
                />
                <InspectionToggle
                  label="Sin manchas"
                  checked={itemsStatus.noStains}
                  onChange={(v) =>
                    setItemsStatus({ ...itemsStatus, noStains: v })
                  }
                />
                <InspectionToggle
                  label="Sin daños físicos"
                  checked={itemsStatus.noPhysicalDamage}
                  onChange={(v) =>
                    setItemsStatus({ ...itemsStatus, noPhysicalDamage: v })
                  }
                />
              </div>
            </section>

            {showDamageInput && (
              <section className=" p-4 mb-3 rounded-xl border bg-accent space-y-3 animate-in fade-in">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    Detalle del problema
                  </label>
                  <textarea
                    className="w-full text-xs p-2 rounded-lg bg-card mt-1 h-16"
                    placeholder="Ej: Falta gancho original, mancha de grasa en la basta..."
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    Monto de Penalidad (S/.)
                  </label>
                  <input
                    type="number"
                    className="w-full text-lg font-bold p-2 rounded-lg bg-card"
                    value={extraDamageCharge}
                    onChange={(e) =>
                      setExtraDamageCharge(Number(e.target.value))
                    }
                  />
                </div>
              </section>
            )}

            {/* SECCIÓN 2: CARGOS EXTRA POR DAÑOS */}
            {!itemsStatus.noPhysicalDamage && (
              <section className="p-4 rounded-xl bg-accent border animate-in slide-in-from-top-2">
                <label className="text-xs font-bold text-slate-400 block mb-2">
                  Monto por reparación / daño:
                </label>
                <input
                  type="number"
                  className="w-full bg-card rounded-lg p-2  font-semibold text-white"
                  placeholder="0.00"
                  onChange={(e) => setExtraDamageCharge(Number(e.target.value))}
                />
              </section>
            )}

            {/* SECCIÓN 3: LIQUIDACIÓN FINANCIERA (TICKET VIRTUAL) */}
            <section className="mt-auto bg-slate-900 text-white p-5 rounded-3xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <HugeiconsIcon icon={Invoice01Icon} size={80} />
              </div>

              <h3 className="text-[10px] font-black text-slate-400 uppercase">
                Resumen de Liquidación
              </h3>

              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold uppercase opacity-60">
                  Garantía Actual
                </span>
                <Badge variant="outline" className="text-white border-white/20">
                  {guarantee?.type === "efectivo"
                    ? "Efectivo"
                    : "Documento / Objeto"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                {summary.daysLate > 0 && (
                  <div className="flex justify-between text-red-200">
                    <span>Mora ({summary.daysLate} d):</span>
                    <span>-{formatCurrency(summary.penaltyAmount)}</span>
                  </div>
                )}
                {extraDamageCharge > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Penalidad daños:</span>
                    <span>-{formatCurrency(extraDamageCharge)}</span>
                  </div>
                )}
              </div>

              {extraDamageCharge > 0 && (
                <div className="flex justify-between text-sm text-red-200">
                  <span>Daños/Reparaciones:</span>
                  <span className="font-bold">
                    -{formatCurrency(extraDamageCharge)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-white/20">
                {summary.isCash ? (
                  <div className="flex justify-between items-end">
                    <span className="text-xs uppercase font-bold">
                      A devolver:
                    </span>
                    <span className="text-2xl font-black text-emerald-200">
                      {formatCurrency(summary.refundAmount)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center ">
                      <span className="text-xs font-bold uppercase">
                        Debe cobrar:
                      </span>
                      <span className="text-xl font-black">
                        {formatCurrency(summary.totalToPay)}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/70 italic text-center">
                      * Cobrar antes de devolver: {guarantee?.description}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleCompleteReturn} // AHORA SÍ SE EJECUTA
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {summary.totalToPay > 0
                ? `COBRAR ${formatCurrency(summary.totalToPay)} Y FINALIZAR`
                : "FINALIZAR RETORNO"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// Sub-componente para los Toggles
function InspectionToggle({ label, checked, onChange }: any) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`p-3 rounded-xl cursor-pointer transition-all flex justify-between items-center ${
        checked ? "bg-emerald-50/10" : "bg-white/20"
      }`}
    >
      <span
        className={`text-xs font-bold ${
          checked ? "text-emerald-700" : "text-slate-500"
        }`}
      >
        {label}
      </span>
      <div
        className={`h-5 w-5 rounded-full flex items-center justify-center ${
          checked ? "bg-emerald-500 text-white" : "bg-slate-200"
        }`}
      >
        {checked && (
          <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={4} />
        )}
      </div>
    </div>
  );
}
