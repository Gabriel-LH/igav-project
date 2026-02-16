"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/button";
import { formatCurrency } from "@/src/utils/currency-format";
import { HugeiconsIcon } from "@hugeicons/react";
import { iron } from "@lucide/lab";
import {
  Tick02Icon,
  AlertCircleIcon,
  Invoice01Icon,
  ContainerTruck02Icon,
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
import { Checkbox } from "@/components/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/input";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { Badge } from "@/components/badge";
import { BadgeCheck, Icon, Trash2, WashingMachine } from "lucide-react";
import { buildReturnTicketHtml } from "../ticket/buil-return-ticket";
import { printTicket } from "@/src/utils/ticket/print-ticket";
import { RentalDTO } from "@/src/interfaces/RentalDTO";
import { processReturn } from "@/src/services/processReturn";
import { RentalItem } from "@/src/types/rentals/type.rentalsItem";
import { useRentalStore } from "@/src/store/useRentalStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";

type StockTarget = "disponible" | "en_lavanderia" | "en_mantenimiento" | "baja";

export function ReturnInspectionDrawer({
  rental,
  client,
  isOverdue,
}: {
  rental: RentalDTO;
  client: any;
  isOverdue: boolean;
}) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [extraDamageCharge, setExtraDamageCharge] = useState(0);
  const [damageNotes, setDamageNotes] = useState("");
  const [waivePenalty, setWaivePenalty] = useState(false);
  const [penaltyCharge, setPenaltyCharge] = useState("");

  const [itemsStatus, setItemsStatus] = useState({
    allPartsPresent: true, // Cambiado a true por defecto para UX
    noStains: true,
    noPhysicalDamage: true,
  });

  const { rentalItems } = useRentalStore();
  const { products } = useInventoryStore();

  console.log("Informacion completa del rental activo", rentalItems);
  console.log("Informacion completa del producto", products);

  const itemsToInspect = useMemo(() => {
    return rental.items.map((item) => ({
      id: item.id || rental.id, // Fallback if needed, but item.id should be present from Grid
      productId: item.productId,
      name: item.productName,
      size: item.size,
    }));
  }, [rental.items]);

  // 1. Group items from rental.items (passed from Grid)
  const itemsToInspects = useMemo(() => {
    // Use rental.items directly as it contains the grouped items (or all items for the group due to my ReturnGrid change)
    return rental.items || [];
  }, [rental.items]);

  // Group by Product for UI
  const groupedItems = useMemo(() => {
    const { products } = useInventoryStore.getState();
    return itemsToInspects.reduce(
      (acc, item) => {
        const product = products.find((p) => p.id === item.productId);
        const key = item.productId;
        if (!acc[key]) {
          acc[key] = {
            product,
            items: [],
            isSerial: product?.is_serial || false,
          };
        }
        acc[key].items.push(item);
        return acc;
      },
      {} as Record<string, { product: any; items: any[]; isSerial: boolean }>,
    );
  }, [itemsToInspects]);

  // State maps itemId -> targetStatus ("en_lavanderia", "mantenimiento", etc.)
  // If not in map, it is NOT being returned (or ignored).
  const [itemsInspection, setItemsInspection] = useState<
    Record<string, StockTarget>
  >({});

  // Initialize all as "en_lavanderia" by default?
  // Probably better to let user select. Or default ALL to "en_lavanderia".
  // Requirement: "user marks via checkboxes which are processing physically".
  // So default is EMPTY (nothing returned).
  // Or default is ALL returned?
  // Existing code defaulted to "en_lavanderia".
  // Let's default to ALL returned for convenience?
  // User says "allow item breakdown and user selection".
  // Defaulting to all selected is usually better UX.

  // Re-initialize state when rental changes
  const [initialized, setInitialized] = useState(false);
  if (!initialized && itemsToInspects.length > 0) {
    const initial = Object.fromEntries(
      itemsToInspects.map((i) => [String(i.id), "en_lavanderia"]),
    );
    // @ts-ignore
    setItemsInspection(initial);
    setInitialized(true);
  }

  const handleToggleItem = (itemId: string, checked: boolean) => {
    setItemsInspection((prev) => {
      const next = { ...prev };
      if (checked) {
        next[itemId] = "en_lavanderia";
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const handleChangeStatus = (itemId: string, status: StockTarget) => {
    setItemsInspection((prev) => ({
      ...prev,
      [itemId]: status,
    }));
  };

  const handleChangeQuantity = (groupItems: any[], qty: number) => {
    // For non-serial: Select first 'qty' items.
    setItemsInspection((prev) => {
      const next = { ...prev };
      groupItems.forEach((item, index) => {
        if (index < qty) {
          // Ensure it has a status
          if (!next[item.id]) next[item.id] = "en_lavanderia";
        } else {
          delete next[item.id];
        }
      });
      return next;
    });
  };

  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(rental.endDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dueDate.getTime();
    const daysLate = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const penaltyAmount = waivePenalty ? 0 : daysLate * 15;
    const totalToPay =
      penaltyAmount + extraDamageCharge + Number(penaltyCharge);

    const guarantee = rental.financials.guarantee;
    const isCash = guarantee?.type === "dinero";
    const guaranteeValue = isCash ? Number(guarantee?.value) || 0 : 0;

    return {
      isCash,
      daysLate,
      penaltyAmount,
      totalToPay,
      refundAmount: isCash
        ? Math.max(0, guaranteeValue - Number(totalToPay))
        : 0,
      guaranteeDescription: guarantee?.description || "Sin descripción",
    };
  }, [rental, waivePenalty, extraDamageCharge, penaltyCharge]);

  const handleCompleteReturn = async () => {
    // Collect items that are in itemsInspection
    const itemsToProcess = itemsToInspects.filter(
      (i) => itemsInspection[String(i.id)],
    );

    if (itemsToProcess.length === 0) return;

    processReturn({
      rentalId: rental.id,
      rentalStatus: !itemsStatus.noPhysicalDamage ? "con_daños" : "devuelto", // This logic might need review if partial return
      items: itemsToProcess.map((item) => ({
        rentalItemId: String(item.id),
        itemStatus: "devuelto",
        stockTarget: itemsInspection[String(item.id)] || "en_lavanderia",
      })),

      totalPenalty: summary.totalToPay,
      guaranteeResult:
        summary.refundAmount > 0 || !summary.isCash ? "devuelta" : "retenida",

      notes: damageNotes,
    });

    const ticketHtml = buildReturnTicketHtml(
      rental,
      client!,
      itemsToInspect, // This was original summary usage, might need update?
      rental.financials.guarantee,
      { itemsInspection, damageNotes: damageNotes || undefined },
      { ...summary, extraDamageCharge },
    );

    setDrawerOpen(false);
    await printTicket(ticketHtml);
  };

  const counts = useMemo(() => {
    const stats = { lavanderia: 0, mantenimiento: 0, baja: 0, disponible: 0 };
    Object.values(itemsInspection).forEach((status) => {
      if (status in stats) stats[status as keyof typeof stats]++;
    });
    return stats;
  }, [itemsInspection]);

  return (
    <>
      <Drawer
        modal={false}
        direction={isMobile ? "bottom" : "right"}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      >
        <DrawerTrigger asChild>
          <Button
            onClick={() => setDrawerOpen(true)}
            className={`h-full min-h-[50px] w-full px-6  text-white transition-all ${
              isOverdue
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <HugeiconsIcon
              icon={ContainerTruck02Icon}
              size={22}
              strokeWidth={2.5}
            />
            <span className="font-bold text-[12px] uppercase text-center leading-tight">
              Procesar retorno
            </span>
          </Button>
        </DrawerTrigger>

        <DrawerContent className={isMobile ? "" : "max-w-md ml-auto h-full"}>
          <DrawerHeader className="border-b">
            <DrawerTitle>Inspección de Retorno</DrawerTitle>
            <DrawerDescription>ID Reserva: {rental.id}</DrawerDescription>
          </DrawerHeader>
          <div className="h-px bg-accent" />
          <div className="p-4 overflow-y-auto ">
            <section className="space-y-3">
              <h3 className="text-[12px] font-semibold uppercase tracking-widest">
                Inspección por prenda
              </h3>

              {Object.values(groupedItems).map((group) => {
                const { product, items, isSerial } = group;
                const productName = product?.name || "Producto";
                const selectedCount = items.filter(
                  (i) => itemsInspection[String(i.id)],
                ).length;

                return (
                  <div
                    key={product?.id || Math.random()}
                    className="p-3 border rounded-xl bg-accent/50 space-y-3 mb-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">
                        {productName} ({items[0]?.size})
                      </span>
                      {isSerial && (
                        <Badge variant="outline" className="text-[9px]">
                          Seriado
                        </Badge>
                      )}
                    </div>

                    {isSerial ? (
                      <div className="space-y-2">
                        {items.map((item) => {
                          const isChecked = !!itemsInspection[String(item.id)];
                          return (
                            <div
                              key={item.id}
                              className="flex flex-col gap-2 p-2 bg-background rounded border"
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(c) =>
                                    handleToggleItem(String(item.id), !!c)
                                  }
                                  id={`chk-insp-${item.id}`}
                                />
                                <label
                                  htmlFor={`chk-insp-${item.id}`}
                                  className="text-xs flex-1 cursor-pointer"
                                >
                                  ID: {item.stockId}
                                </label>
                              </div>
                              {isChecked && (
                                <div className="flex gap-1 pl-6">
                                  {[
                                    {
                                      id: "en_lavanderia",
                                      icon: <WashingMachine size={14} />,
                                      color: "text-blue-500",
                                      bg: "bg-blue-100",
                                    },
                                    {
                                      id: "en_mantenimiento",
                                      icon: <Icon iconNode={iron} size={14} />,
                                      color: "text-amber-500",
                                      bg: "bg-amber-100",
                                    },
                                    {
                                      id: "baja",
                                      icon: <Trash2 size={14} />,
                                      color: "text-red-500",
                                      bg: "bg-red-100",
                                    },
                                  ].map((opt) => (
                                    <button
                                      key={opt.id}
                                      onClick={() =>
                                        handleChangeStatus(
                                          String(item.id),
                                          opt.id as StockTarget,
                                        )
                                      }
                                      className={`p-1 rounded ${itemsInspection[String(item.id)] === opt.id ? opt.bg + " " + opt.color : "text-muted-foreground hover:bg-muted"}`}
                                      title={opt.id}
                                    >
                                      {opt.icon}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Non-Serial: Quantity Input */}
                        <div className="flex items-center gap-3">
                          <Label className="text-xs">Recibidos:</Label>
                          <Input
                            type="number"
                            min={0}
                            max={items.length}
                            value={selectedCount}
                            onChange={(e) =>
                              handleChangeQuantity(
                                items,
                                Number(e.target.value),
                              )
                            }
                            className="w-16 h-7 text-center font-bold"
                          />
                          <span className="text-xs text-muted-foreground">
                            / {items.length}
                          </span>
                        </div>
                        {/* Batch Status Selector? For simplicity, all default to Lavanderia. 
                               If user wants mixed status for non-serial, it's hard without splitting. 
                               Assuming batch status for now or simple default. */}
                        {selectedCount > 0 && (
                          <div className="text-[10px] text-muted-foreground italic pl-1">
                            Se enviarán a lavandería.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>

            <section className="border rounded-2xl px-2 py-2 mb-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">
                Resumen Operativo
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {counts.lavanderia > 0 && (
                  <div className="flex items-center gap-2 text-[11px] bg-blue-100/10 border border-blue-100/10 font-bold text-blue-600 px-2 py-1 rounded-lg">
                    <span className="flex items-center gap-1">
                      <WashingMachine size={16} className="text-blue-600" />
                      {counts.lavanderia} a Lavandería
                    </span>
                  </div>
                )}
                {counts.mantenimiento > 0 && (
                  <div className="flex items-center gap-2 text-[11px] bg-amber-100/10 border border-amber-100/10 font-bold text-amber-600 px-2 py-1 rounded-lg">
                    <span className="flex items-center gap-1">
                      <Icon
                        iconNode={iron}
                        size={16}
                        className="text-amber-600"
                      />{" "}
                      {counts.mantenimiento} a Reparación
                    </span>
                  </div>
                )}
                {counts.baja > 0 && (
                  <div className="flex items-center gap-2 text-[11px] bg-red-100/10 border border-red-100/10 font-bold text-red-600 px-2 py-1 rounded-lg">
                    <span className="flex items-center gap-1">
                      <Trash2 size={16} className="text-red-600" />{" "}
                      {counts.baja} de Baja
                    </span>
                  </div>
                )}
                {counts.disponible > 0 && (
                  <div className="flex items-center gap-2 text-[11px] bg-emerald-100/10 border border-emerald-100/10 font-bold text-emerald-600 px-2 py-1 rounded-lg">
                    <span className="flex items-center gap-1">
                      <BadgeCheck size={16} className="text-emerald-600" />{" "}
                      {counts.disponible} a Catálogo
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* OPCIÓN PERDONAR MORA */}
            {summary.daysLate > 0 && (
              <div
                onClick={() => setWaivePenalty(!waivePenalty)}
                className="flex items-center justify-between p-3 mb-3 border border-dashed rounded-xl cursor-pointer"
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

            {(!itemsStatus.noStains || !itemsStatus.allPartsPresent) && (
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
                    value={penaltyCharge}
                    placeholder="0.00"
                    onChange={(e) => setPenaltyCharge(e.target.value)}
                  />
                </div>
              </section>
            )}

            {/* SECCIÓN 2: CARGOS EXTRA POR DAÑOS */}
            {!itemsStatus.noPhysicalDamage && (
              <section className="p-4 rounded-xl bg-accent mb-3 border animate-in slide-in-from-top-2">
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
                  {rental.financials?.guarantee?.type === "dinero"
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
                      * Cobrar antes de devolver:{" "}
                      {rental.financials?.guarantee?.description}
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
function InspectionToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
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
