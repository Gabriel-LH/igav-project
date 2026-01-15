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
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/drawer";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { OPERATIONS_MOCK } from "@/src/mocks/mock.operation";
import { MOCK_GUARANTEE } from "@/src/mocks/mock.guarantee";
import { Badge } from "@/components/badge";

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
    const penaltyAmount = daysLate * 15; // Regla de negocio

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
  }, [reservation.endDate, extraDamageCharge, guarantee]);

  // Mostrar inputs de multa si algo falla
  const showDamageInput =
    !itemsStatus.allPartsPresent ||
    !itemsStatus.noStains ||
    !itemsStatus.noPhysicalDamage;

  return (
    <>
      <Drawer
        direction={isMobile ? "bottom" : "right"}
        //open={isDrawerOpen}
        //onOpenChange={handleDrawerOpenChange}
      >
        <DrawerTrigger className="w-full">
          <Button
            className={`h-full min-h-[50px] w-full px-6  text-white transition-all ${
              isOverdue
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <HugeiconsIcon icon={PackageReceiveIcon} size={22} strokeWidth={2.2} />
            <span className="font-bold text-[12px] uppercase text-center leading-tight">
              Procesar retorno
            </span>
          </Button>
        </DrawerTrigger>

        <DrawerContent className={isMobile ? "" : "max-w-md ml-auto h-full"}>
          <DrawerHeader>
            <DrawerTitle>Inspección de Retorno</DrawerTitle>
            <DrawerDescription>ID Reserva: {reservation.id}</DrawerDescription>
          </DrawerHeader>
          <div className="h-px bg-accent" />
          <div className="flex flex-col h-full p-6 gap-6">
            {/* SECCIÓN 1: CHECKLIST DE ESTADO */}
            <section className="space-y-4">
              <h3 className="text-[15px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <HugeiconsIcon
                  icon={Settings03Icon}
                  size={20}
                  strokeWidth={2.2}
                />{" "}
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
              <section className=" p-4 rounded-xl border bg-accent space-y-3 animate-in fade-in">
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

            <Button
              disabled={!itemsStatus.allPartsPresent}
              onClick={() => {
                // Aquí llamarías al store de Zustand para finalizar
                onClose();
              }}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-md font-semibold"
            >
                <>
              <HugeiconsIcon icon={CheckmarkBadge03Icon} size={22} strokeWidth={2.2} />
              {summary.totalToPay > 0 && !summary.isCash
                ? "COBRAR Y FINALIZAR"
                : "FINALIZAR RETORNO"}
                </>
            </Button>
          </div>
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
