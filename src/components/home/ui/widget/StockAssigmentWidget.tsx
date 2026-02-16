// src/components/common/StockAssignmentWidget.tsx
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
  Layers01Icon, // Icono para lotes
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { OpType } from "@/src/utils/reservation/checkAvailability";
import { toast } from "sonner";
import { BRANCH_MOCKS } from "@/src/mocks/mock.branch";

interface StockAssignmentWidgetProps {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  operationType: OpType;
  dateRange: { from: Date; to: Date };
  currentBranchId: string;

  // 🔥 NUEVA PROP: Define si es ítem único (Terno) o Lote (Corbata)
  isSerial?: boolean;
  // 🔥 PROP DE FILTRO: Define si filtramos solo disponibles HOY
  isImmediate?: boolean;

  onAssignmentChange: (selectedIds: string[]) => void;

  // 🔥 NUEVA PROP: IDs que vienen asignados inicialmente
  initialSelections?: string[];
  readOnly?: boolean;
}

export function StockAssignmentWidget({
  productId,
  size,
  color,
  quantity,
  operationType,
  dateRange,
  currentBranchId,
  isSerial = true, // Por defecto asumimos serializado (más seguro)
  isImmediate = false,
  onAssignmentChange,
  initialSelections = [], // 👈 NUEVO: IDs que ya vienen asignados
  readOnly = false,
}: StockAssignmentWidgetProps) {
  const { stock } = useInventoryStore();

  const lastEmittedIdsRef = useRef<string>("");

  const [selections, setSelections] = useState<Record<number, string>>(() => {
    // Convertimos el array simple [ID1, ID2] a un objeto {0: ID1, 1: ID2}
    const init: Record<number, string> = {};
    initialSelections.forEach((id, index) => {
      if (id) init[index] = id;
    });
    return init;
  });

  // 1. Filtrar candidatos VÁLIDOS
  const validCandidates = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];

    return stock.filter((s) => {
      const isBaseMatch =
        String(s.productId) === String(productId) &&
        s.size === size &&
        s.color === color &&
        s.status !== "baja" &&
        s.status !== "vendido";

      if (!isBaseMatch) return false;

      if (operationType === "venta" && !s.isForSale) return false;
      if (operationType === "alquiler" && !s.isForRent) return false;

      // Filtro de Inmediatez
      if (isImmediate) {
        if (s.status !== "disponible") return false;
      }

      // Si es alquiler futuro (no inmediato), permitimos ver alquilados
      return (
        s.status === "disponible" ||
        (!isImmediate && operationType === "alquiler")
      );
    });
  }, [stock, productId, size, color, operationType, dateRange, isImmediate]);

  // 2. Notificar al padre
  useEffect(() => {
    const ids = Object.values(selections);

    const idsString = JSON.stringify(ids);
    // Si es lote, el array tendrá IDs repetidos, lo cual está bien para processTransaction
    if (lastEmittedIdsRef.current !== idsString) {
      lastEmittedIdsRef.current = idsString;
      onAssignmentChange(ids);
    }
  }, [selections, onAssignmentChange]);

  
  // 3. Manejador para Lotes (Bulk Selection)
  const handleBatchSelect = (stockId: string) => {
    const newSelections: Record<number, string> = {};
    // Asignamos el MISMO ID a todas las posiciones requeridas
    for (let i = 0; i < quantity; i++) {
      newSelections[i] = stockId;
    }
    setSelections(newSelections);
  };

  // 4. Auto-Asignación (Inteligente para Serial y Lotes)
  const handleAutoAllocate = () => {
    const newSelections: Record<number, string> = {};
    const usedIds = new Set<string>();

    const sortedCandidates = [...validCandidates].sort((a, b) => {
      // Prioridad: Sede Actual -> Otras Sedes
      if (a.branchId === currentBranchId && b.branchId !== currentBranchId)
        return -1;
      if (a.branchId !== currentBranchId && b.branchId === currentBranchId)
        return 1;
      // Prioridad secundaria: Mayor cantidad (para lotes)
      return b.quantity - a.quantity;
    });

    if (!isSerial) {
      // --- LÓGICA LOTE ---
      // Buscamos el primer lote que tenga suficiente cantidad
      const bestBatch = sortedCandidates.find((s) => s.quantity >= quantity);

      if (bestBatch) {
        // Llenamos todo con ese ID
        for (let i = 0; i < quantity; i++) newSelections[i] = bestBatch.id;
        setSelections(newSelections);
        toast.success("Lote asignado automáticamente.");
      } else {
        toast.warning("No se encontró un lote con suficiente cantidad.");
      }
      return;
    }

    // --- LÓGICA SERIAL ---
    for (let i = 0; i < quantity; i++) {
      const candidate = sortedCandidates.find((c) => !usedIds.has(c.id));
      if (candidate) {
        newSelections[i] = candidate.id;
        usedIds.add(candidate.id);
      }
    }

    setSelections(newSelections);
    if (Object.keys(newSelections).length < quantity) {
      toast.warning("Stock parcial asignado. Faltan unidades.");
    } else {
      toast.success("Stock asignado automáticamente.");
    }
  };

  // ---------------------------------------------------------
  // RENDERIZADO: MODO LOTE (NO SERIALIZADO)
  // ---------------------------------------------------------
  if (!isSerial) {
    const currentBatchId = selections[0]; // Basta con ver el primero
    const currentBatch = stock.find((s) => s.id === currentBatchId);

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
            value={currentBatchId || ""}
          >
            <SelectTrigger className="flex-1 h-9 text-xs">
              <SelectValue placeholder="Seleccione lote de origen..." />
            </SelectTrigger>
            <SelectContent>
              {validCandidates.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                  disabled={s.quantity < quantity} // Validamos capacidad del lote
                  className={
                    s.quantity < quantity
                      ? "text-muted-foreground opacity-50"
                      : ""
                  }
                >
                  {s.id} (Disp: {s.quantity}) -{" "}
                  {BRANCH_MOCKS.find((b) => b.id === s.branchId)?.name}
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

        {currentBatch && (
          <div className="text-[10px] text-emerald-600 flex items-center gap-1 p-1 rounded px-2">
            <HugeiconsIcon icon={Location01Icon} className="w-3 h-3" />
            Se retirarán {quantity} unidades del lote{" "}
            <strong>{currentBatch.id}</strong>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDERIZADO: MODO SERIAL (TU CÓDIGO ANTERIOR MEJORADO)
  // ---------------------------------------------------------
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
          const selectedItem = stock.find((s) => s.id === selectedId);
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
                      {selectedItem.id}
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
                      validCandidates.map((s) => {
                        const isUsed = Object.values(selections).includes(s.id);
                        return (
                          <SelectItem key={s.id} value={s.id} disabled={isUsed}>
                            {s.id} - {s.status} (
                            {
                              BRANCH_MOCKS.find((b) => b.id === s.branchId)
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
