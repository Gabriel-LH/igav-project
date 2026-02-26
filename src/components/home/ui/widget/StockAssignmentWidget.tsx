// src/components/home/ui/widget/StockAssignmentWidget.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Badge } from "@/components/badge";
import {
  MagicWand01Icon,
  Delete02Icon,
  Location01Icon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { OpType } from "@/src/utils/reservation/checkAvailability";
import { toast } from "sonner";
import { BRANCH_MOCKS } from "@/src/mocks/mock.branch";

interface StockAssignmentWidgetProps {
  productId: string;
  sizeId: string;
  colorId: string;
  quantity: number;
  operationType: OpType;
  dateRange: { from: Date; to: Date };
  currentBranchId: string;
  isSerial?: boolean;
  isImmediate?: boolean;
  onAssignmentChange: (selectedIds: string[]) => void;
  initialSelections?: string[];
  readOnly?: boolean;
}

export function StockAssignmentWidget({
  productId,
  sizeId,
  colorId,
  quantity,
  operationType,
  dateRange,
  currentBranchId,
  isSerial = true,
  isImmediate = false,
  onAssignmentChange,
  initialSelections = [],
  readOnly = false,
}: StockAssignmentWidgetProps) {
  const { inventoryItems, stockLots } = useInventoryStore();

  const lastEmittedIdsRef = useRef<string>("");

  const [selections, setSelections] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    initialSelections.forEach((id, index) => {
      if (id) init[index] = id;
    });
    return init;
  });

  // 1. Filtrar candidatos VÁLIDOS
  const validCandidates = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];

    if (isSerial) {
      return inventoryItems.filter((i) => {
        const isBaseMatch =
          i.productId === productId &&
          i.sizeId === sizeId &&
          i.colorId === colorId &&
          i.status !== "retirado" &&
          i.status !== "vendido";

        if (!isBaseMatch) return false;
        if (operationType === "venta" && !i.isForSale) return false;
        if (operationType === "alquiler" && !i.isForRent) return false;

        if (isImmediate && i.status !== "disponible") return false;

        return (
          i.status === "disponible" ||
          (!isImmediate && operationType === "alquiler")
        );
      });
    } else {
      return stockLots.filter((l) => {
        const isBaseMatch =
          l.productId === productId &&
          l.sizeId === sizeId &&
          l.colorId === colorId &&
          (l.status as any) !== "retirado" &&
          (l.status as any) !== "vendido";

        if (!isBaseMatch) return false;
        if (operationType === "venta" && !l.isForSale) return false;
        if (operationType === "alquiler" && !l.isForRent) return false;

        if (isImmediate && (l.status !== "disponible" || l.quantity <= 0))
          return false;

        return (
          (l.status === "disponible" ||
            (!isImmediate && operationType === "alquiler")) &&
          l.quantity > 0
        );
      });
    }
  }, [inventoryItems, stockLots, productId, isSerial]);

  // 2. Notificar al padre
  useEffect(() => {
    const ids = Object.values(selections);
    const idsString = JSON.stringify(ids);
    if (lastEmittedIdsRef.current !== idsString) {
      lastEmittedIdsRef.current = idsString;
      onAssignmentChange(ids);
    }
  }, [selections, onAssignmentChange]);

  // 3. Manejador para Lotes
  const handleBatchSelect = (id: string) => {
    const newSelections: Record<number, string> = {};
    for (let i = 0; i < quantity; i++) {
      newSelections[i] = id;
    }
    setSelections(newSelections);
  };

  // 4. Auto-Asignación
  const handleAutoAllocate = () => {
    const newSelections: Record<number, string> = {};
    const usedCodes = new Set<string>();

    const sortedCandidates = [...validCandidates].sort((a: any, b: any) => {
      if (a.branchId === currentBranchId && b.branchId !== currentBranchId)
        return -1;
      if (a.branchId !== currentBranchId && b.branchId === currentBranchId)
        return 1;
      return (b.quantity || 0) - (a.quantity || 0);
    });

    if (!isSerial) {
      const bestLot = sortedCandidates.find((l: any) => l.quantity >= quantity);
      if (bestLot) {
        for (let i = 0; i < quantity; i++) newSelections[i] = bestLot.id;
        setSelections(newSelections);
        toast.success("Lote asignado automáticamente.");
      } else {
        toast.warning("No se encontró un lote con suficiente cantidad.");
      }
      return;
    }

    for (let i = 0; i < quantity; i++) {
      const candidate = sortedCandidates.find((c: any) => !usedCodes.has(c.id));
      if (candidate) {
        newSelections[i] = (candidate as any).id;
        usedCodes.add((candidate as any).id);
      }
    }

    setSelections(newSelections);
    if (Object.keys(newSelections).length < quantity) {
      toast.warning("Stock parcial asignado. Faltan unidades.");
    } else {
      toast.success("Stock asignado automáticamente.");
    }
  };

  if (!isSerial) {
    const currentId = selections[0];
    const currentLot = stockLots.find((l) => l.id === currentId);

    return (
      <div className="p-3 border rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-2">
            <HugeiconsIcon icon={Layers01Icon} className="w-3 h-3" />
            Selección de Lote
          </span>
          <Badge variant="secondary" className="text-[9px]">
            Cant: {quantity}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Select
            aria-hidden={false}
            onValueChange={handleBatchSelect}
            value={currentId || ""}
          >
            <SelectTrigger className="flex-1 h-9 text-xs">
              <SelectValue placeholder="Seleccione lote de origen..." />
            </SelectTrigger>
            <SelectContent>
              {validCandidates.map((l: any) => (
                <SelectItem
                  key={l.id}
                  value={l.id}
                  disabled={l.quantity < quantity}
                  className={
                    l.quantity < quantity
                      ? "text-muted-foreground opacity-50"
                      : ""
                  }
                >
                  {l.variantCode} (Disp: {l.quantity}) -{" "}
                  {BRANCH_MOCKS.find((b) => b.id === l.branchId)?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={handleAutoAllocate}
            title="Auto-asignar mejor lote"
          >
            <HugeiconsIcon
              icon={MagicWand01Icon}
              className="w-4 h-4 text-blue-600"
            />
          </Button>
        </div>

        {currentLot && (
          <div className="text-[10px] text-emerald-600 flex items-center gap-1 p-1 rounded px-2">
            <HugeiconsIcon icon={Location01Icon} className="w-3 h-3" />
            Se retirarán {quantity} unidades del lote{" "}
            <strong>{currentLot.variantCode}</strong>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-dashed">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
          <HugeiconsIcon
            icon={Location01Icon}
            strokeWidth={3}
            className="w-3 h-3"
          />
          Asignación de Prendas Físicas
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAutoAllocate}
          className="h-6 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
        >
          <HugeiconsIcon
            icon={MagicWand01Icon}
            strokeWidth={3}
            className="w-3 h-3 mr-1"
          />
          Auto-asignar
        </Button>
      </div>

      <div className="space-y-2">
        {Array.from({ length: quantity }).map((_, index) => {
          const selectedId = selections[index];
          const selectedItem = inventoryItems.find((i) => i.id === selectedId);
          const isLocal = selectedItem?.branchId === currentBranchId;

          return (
            <div
              key={index}
              className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center border border-primary/20">
                {index + 1}
              </div>

              {selectedItem ? (
                <div
                  className={`flex-1 flex items-center justify-between p-2 rounded border border-l-4 shadow-sm ${isLocal ? "border-l-emerald-500 bg-background" : "border-l-orange-500 bg-orange-50/10"}`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold font-mono">
                      {selectedItem.serialCode}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground">
                        {
                          BRANCH_MOCKS.find(
                            (b) => b.id === selectedItem.branchId,
                          )?.name
                        }
                      </span>
                      {selectedItem.condition &&
                        selectedItem.condition !== "Nuevo" && (
                          <Badge
                            variant="outline"
                            className="text-[8px] h-4 px-1 py-0"
                          >
                            {selectedItem.condition}
                          </Badge>
                        )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-red-500"
                    onClick={() => {
                      const newSel = { ...selections };
                      delete newSel[index];
                      setSelections(newSel);
                    }}
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      strokeWidth={3}
                      className="w-4 h-4"
                    />
                  </Button>
                </div>
              ) : (
                <Select
                  value=""
                  onValueChange={(val) =>
                    setSelections((prev) => ({ ...prev, [index]: val }))
                  }
                  disabled={readOnly}
                >
                  <SelectTrigger className="flex-1 h-9 text-xs bg-background">
                    <SelectValue placeholder="Seleccionar código o escanear..." />
                  </SelectTrigger>
                  <SelectContent>
                    {validCandidates.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        No hay stock disponible.
                      </div>
                    ) : (
                      validCandidates.map((i: any) => {
                        const isUsed = Object.values(selections).includes(i.id);
                        return (
                          <SelectItem key={i.id} value={i.id} disabled={isUsed}>
                            {i.serialCode} - {i.status} (
                            {
                              BRANCH_MOCKS.find((b) => b.id === i.branchId)
                                ?.name
                            }
                            )
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
