"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReceiveStats } from "./ui/ReceiveStats";
import { PendingItemsList } from "./ui/PendingItemsList";
import { ActivityLog } from "./ui/ActivityLog";
import { ScanInput } from "./ui/ScanInput";
import { CloseReceiveModal } from "./ui/CloseReceiveModal";
import { WrongBranchModal } from "./ui/WronBranchModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { CheckCircle, Loader2, Store, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GLOBAL_BRANCH_ID, useBranchStore } from "@/src/store/useBranchStore";
import { getProductsAction } from "@/src/app/(tenant)/tenant/actions/product.actions";
import {
  listReceivePendingAction,
  markReceiveAvailableAction,
  receiveStockQuantityAction,
} from "@/src/app/(tenant)/tenant/actions/stock.actions";
import { listTransfersAction } from "@/src/app/(tenant)/tenant/actions/transfer.actions";
import { Product } from "@/src/types/product/type.product";
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReceiveStockLine = {
  id: string;
  type: "stock";
  productName: string;
  variantName: string;
  variantCode: string;
  destinationBranch: string;
  quantityExpected: number;
  scanCodes: string[];
  image?: string;
  transferReference?: string;
  originBranch?: string;
  transferPriority?: "baja" | "normal" | "alta" | "urgente";
};

type ReceiveSerializedLine = {
  id: string;
  type: "serialized";
  productName: string;
  variantName: string;
  variantCode: string;
  destinationBranch: string;
  serialItems: Array<{ id: string; serialCode: string }>;
  image?: string;
  transferReference?: string;
  originBranch?: string;
  transferPriority?: "baja" | "normal" | "alta" | "urgente";
};

type ReceiveLine = ReceiveStockLine | ReceiveSerializedLine;

type TransferContext = {
  referenceNumber: string;
  fromBranchName: string;
  priority: "baja" | "normal" | "alta" | "urgente";
};

type CommitStockResult = {
  stockId: string;
  quantity: number;
  ok: boolean;
  error?: string;
};

type CommitSerialResult = {
  itemId: string;
  ok: boolean;
  error?: string;
};

type CommitResult = CommitStockResult | CommitSerialResult;

interface Activity {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  itemCode?: string;
  timestamp: Date;
}

// ─── Module-level cache ───────────────────────────────────────────────────────

let cachedProducts: Product[] | null = null;
let cachedVariants: ProductVariant[] | null = null;
let productsPromise: Promise<Awaited<ReturnType<typeof getProductsAction>>> | null = null;
const lastPendingLoadByBranch = new Map<string, number>();

// ─────────────────────────────────────────────────────────────────────────────

export const ReceiveModule: React.FC = () => {
  // ── Pending lines from server (loaded once, refreshed after commit) ──────
  const [receiveLines, setReceiveLines] = useState<ReceiveLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // ── LOCAL scan accumulator — 100% in-memory, zero server calls ───────────
  // stockCounts: { [lotId]: localCount }
  const [localStockCounts, setLocalStockCounts] = useState<Record<string, number>>({});
  // serialIds: set of serial IDs scanned locally
  const [localSerialIds, setLocalSerialIds] = useState<Set<string>>(new Set());

  // ── Committed counts (already saved to server) ───────────────────────────
  // Kept separate so we can show "committed" vs "staged" state per row
  const [committedStockCounts, setCommittedStockCounts] = useState<Record<string, number>>({});
  const [committedSerialIds, setCommittedSerialIds] = useState<Set<string>>(new Set());

  const [activities, setActivities] = useState<Activity[]>([]);
  const [lastScannedCode, setLastScannedCode] = useState<string>();
  const [lastScanStatus, setLastScanStatus] = useState<"success" | "error">();
  const [receiveMode, setReceiveMode] = useState<"transit" | "service">(
    "transit",
  );

  // ── Branch / global store ─────────────────────────────────────────────────
  const storeBranches = useBranchStore((state) => state.branches);
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
  const setSelectedBranchId = useBranchStore((state) => state.setSelectedBranchId);
  const canUseGlobal = useBranchStore((state) => state.canUseGlobal);
  const products = useInventoryStore((state) => state.products);
  const productVariants = useInventoryStore((state) => state.productVariants);
  const setProducts = useInventoryStore((state) => state.setProducts);
  const setProductVariants = useInventoryStore((state) => state.setProductVariants);

  const branches = storeBranches;
  const branchOptions = useMemo(
    () => canUseGlobal ? [{ id: GLOBAL_BRANCH_ID, name: "Global" }, ...branches] : branches,
    [canUseGlobal, branches],
  );

  // ── Modals ────────────────────────────────────────────────────────────────
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [wrongBranchModalOpen, setWrongBranchModalOpen] = useState(false);
  const [pendingError, setPendingError] = useState<{
    kind: "stock" | "serial";
    itemCode: string;
    expectedBranch: string;
    currentBranch: string;
    stockId?: string;
    serialId?: string;
  } | null>(null);
  const [scanMode, setScanMode] = useState<"single" | "batch">("single");
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  const effectiveBranchId = selectedBranchId || branches[0]?.id || "";
  const isGlobal = canUseGlobal && selectedBranchId === GLOBAL_BRANCH_ID;
  const isTransitMode = receiveMode === "transit";
  const receiveModeLabel = isTransitMode
    ? "En tránsito"
    : "Lavandería / Mantenimiento";

  const currentBranch = useMemo(() => {
    if (isGlobal) return "Global";
    return branchOptions.find((b) => b.id === effectiveBranchId)?.name ?? "Sucursal";
  }, [branchOptions, effectiveBranchId, isGlobal]);

  // ── Derived counts ────────────────────────────────────────────────────────

  // Combined = committed + local (not yet committed)
  const combinedStockCounts = useMemo(() => {
    const result: Record<string, number> = { ...committedStockCounts };
    for (const [id, count] of Object.entries(localStockCounts)) {
      result[id] = (result[id] ?? 0) + count;
    }
    return result;
  }, [committedStockCounts, localStockCounts]);

  const combinedSerialIds = useMemo(() => {
    const result = new Set(committedSerialIds);
    for (const id of localSerialIds) result.add(id);
    return result;
  }, [committedSerialIds, localSerialIds]);

  const getLineScannedCount = useCallback(
    (line: ReceiveLine) => {
      if (line.type === "stock") {
        return Math.min(
          combinedStockCounts[line.id] ?? 0,
          line.quantityExpected,
        );
      }
      return line.serialItems.filter((s) => combinedSerialIds.has(s.id)).length;
    },
    [combinedSerialIds, combinedStockCounts],
  );

  const getLinePendingCount = useCallback(
    (line: ReceiveLine) => {
      if (line.type === "stock") {
        return Math.max(
          line.quantityExpected - (combinedStockCounts[line.id] ?? 0),
          0,
        );
      }
      const scanned = line.serialItems.filter((s) =>
        combinedSerialIds.has(s.id),
      ).length;
      return Math.max(line.serialItems.length - scanned, 0);
    },
    [combinedSerialIds, combinedStockCounts],
  );

  const visibleLines = useMemo(
    () => receiveLines.filter((line) => getLinePendingCount(line) > 0),
    [getLinePendingCount, receiveLines],
  );

  const totalExpected = useMemo(() => {
    return visibleLines.reduce((total, line) => {
      if (line.type === "stock") return total + line.quantityExpected;
      return total + line.serialItems.length;
    }, 0);
  }, [visibleLines]);

  const scannedCount = useMemo(() => {
    return visibleLines.reduce(
      (total, line) => total + getLineScannedCount(line),
      0,
    );
  }, [getLineScannedCount, visibleLines]);

  // Staged = locally scanned but NOT yet committed
  const stagedCount = useMemo(() => {
    const stockCount = Object.values(localStockCounts).reduce((s, v) => s + v, 0);
    return stockCount + localSerialIds.size;
  }, [localStockCounts, localSerialIds]);

  // Session total: never goes below what we've seen (prevents bar shrinking)
  const sessionTotalRef = useRef(0);
  const rawTotal = totalExpected + scannedCount;
  if (rawTotal > sessionTotalRef.current) sessionTotalRef.current = rawTotal;
  const progressTotalExpected = sessionTotalRef.current;

  const pendingCount = useMemo(() => {
    return visibleLines.reduce(
      (total, line) => total + getLinePendingCount(line),
      0,
    );
  }, [getLinePendingCount, visibleLines]);
  const allSelected = totalExpected === 0 && scannedCount > 0;

  // ── Activity ──────────────────────────────────────────────────────────────
  const addActivity = useCallback((type: Activity["type"], message: string, itemCode?: string) => {
    setActivities((prev) => [
      { id: Date.now().toString(), type, message, itemCode, timestamp: new Date() },
      ...prev,
    ].slice(0, 50));
  }, []);

  const branchNameById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name])),
    [branches],
  );

  const formatVariantName = useCallback((variant?: ProductVariant) => {
    if (!variant) return "Variante";
    const values = Object.values(variant.attributes || {});
    if (values.length > 0) return values.join(" / ");
    return variant.variantCode;
  }, []);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadProducts = useCallback(async (): Promise<{ products: Product[]; variants: ProductVariant[] }> => {
    if (cachedProducts && cachedVariants) return { products: cachedProducts, variants: cachedVariants };
    if (products.length > 0 && productVariants.length > 0) {
      cachedProducts = products; cachedVariants = productVariants;
      return { products, variants: productVariants };
    }
    if (!productsPromise) productsPromise = getProductsAction();
    const result = await productsPromise;
    if (result?.success && result.data) {
      cachedProducts = result.data.products;
      cachedVariants = result.data.variants;
      setProducts(result.data.products);
      setProductVariants(result.data.variants);
      return { products: result.data.products, variants: result.data.variants };
    }
    return { products: [], variants: [] };
  }, [productVariants, products, setProductVariants, setProducts]);

  const loadPending = useCallback(async () => {
    if (!effectiveBranchId || isGlobal) { setReceiveLines([]); return; }
    setIsLoading(true);
    const [pendingResult, productsResult, transfersResult] = await Promise.all([
      listReceivePendingAction({
        branchId: effectiveBranchId,
        lotStatuses: isTransitMode ? ["en_transito"] : [],
        itemStatuses: isTransitMode
          ? ["en_transito"]
          : ["en_lavanderia", "en_mantenimiento"],
      }),
      loadProducts(),
      isTransitMode ? listTransfersAction() : Promise.resolve({ success: true, data: [] }),
    ]);

    if (!pendingResult.success || !pendingResult.data) {
      addActivity("error", pendingResult.error || "No se pudo cargar pendientes");
      setReceiveLines([]);
      setIsLoading(false);
      return;
    }

    const prods: Product[] = productsResult.products ?? [];
    const vars: ProductVariant[] = productsResult.variants ?? [];
    const productMap = new Map(prods.map((p) => [p.id, p]));
    const variantMap = new Map(vars.map((v) => [v.id, v]));
    const transferByStockId = new Map<string, TransferContext>();
    const transferByItemId = new Map<string, TransferContext>();

    if (isTransitMode && transfersResult.success && Array.isArray(transfersResult.data)) {
      for (const transfer of transfersResult.data) {
        if (transfer.status !== "en_transito" || transfer.toBranchId !== effectiveBranchId) {
          continue;
        }

        const transferContext: TransferContext = {
          referenceNumber: transfer.referenceNumber,
          fromBranchName: transfer.fromBranchName,
          priority: transfer.priority,
        };

        for (const dispatchItem of transfer.dispatchItems) {
          if (dispatchItem.stockId) {
            transferByStockId.set(dispatchItem.stockId, transferContext);
          }
          if (dispatchItem.itemId) {
            transferByItemId.set(dispatchItem.itemId, transferContext);
          }
        }
      }
    }

    const stockLines: ReceiveLine[] = pendingResult.data.stockLots.map((lot) => {
      const product = productMap.get(lot.productId);
      const variant = variantMap.get(lot.variantId);
      const transferContext = transferByStockId.get(lot.id);
      return {
        id: lot.id,
        type: "stock" as const,
        productName: product?.name || lot.productId,
        variantName: formatVariantName(variant),
        variantCode: variant?.variantCode || lot.variantId,
        destinationBranch: branchNameById.get(lot.branchId) || lot.branchId,
        quantityExpected: lot.quantity,
        image: variant?.image || product?.image || "",
        scanCodes: [lot.barcode, variant?.barcode, lot.id, variant?.variantCode].filter(Boolean) as string[],
        transferReference: transferContext?.referenceNumber,
        originBranch: transferContext?.fromBranchName,
        transferPriority: transferContext?.priority,
      };
    });


    const serializedMap = new Map<string, ReceiveSerializedLine>();
    pendingResult.data.serializedItems.forEach((item) => {
      const product = productMap.get(item.productId);
      const variant = variantMap.get(item.variantId);
      const key = `${item.variantId}:${item.branchId}`;
      const image = variant?.image || product?.image || "";
      const transferContext = transferByItemId.get(item.id);
      if (!serializedMap.has(key)) {
        serializedMap.set(key, {
          id: `serial-${key}`, type: "serialized",
          productName: product?.name || item.productId,
          variantName: formatVariantName(variant),
          variantCode: variant?.variantCode || item.variantId,
          destinationBranch: branchNameById.get(item.branchId) || item.branchId,
          image,
          serialItems: [],
          transferReference: transferContext?.referenceNumber,
          originBranch: transferContext?.fromBranchName,
          transferPriority: transferContext?.priority,
        });
      }
      serializedMap.get(key)!.serialItems.push({ id: item.id, serialCode: item.serialCode });
    });

    setReceiveLines([...stockLines, ...Array.from(serializedMap.values())]);
    setIsLoading(false);
  }, [
    addActivity,
    branchNameById,
    effectiveBranchId,
    formatVariantName,
    isGlobal,
    isTransitMode,
    loadProducts,
  ]);

  // ── Session storage ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !effectiveBranchId) return;
    const key = `receive_local_${effectiveBranchId}_${receiveMode}`;
    sessionStorage.setItem(key, JSON.stringify({
      localStockCounts,
      localSerialIds: Array.from(localSerialIds),
      committedStockCounts,
      committedSerialIds: Array.from(committedSerialIds),
    }));
  }, [
    localStockCounts,
    localSerialIds,
    committedStockCounts,
    committedSerialIds,
    effectiveBranchId,
    receiveMode,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !effectiveBranchId) return;
    const key = `receive_local_${effectiveBranchId}_${receiveMode}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      try {
        const { localStockCounts: lsc, localSerialIds: lsi, committedStockCounts: csc, committedSerialIds: csi } = JSON.parse(saved);
        setLocalStockCounts(lsc ?? {});
        setLocalSerialIds(new Set(lsi ?? []));
        setCommittedStockCounts(csc ?? {});
        setCommittedSerialIds(new Set(csi ?? []));
      } catch { /* ignore */ }
    } else {
      setLocalStockCounts({});
      setLocalSerialIds(new Set());
      setCommittedStockCounts({});
      setCommittedSerialIds(new Set());
    }
    const pendingKey = `${effectiveBranchId}:${receiveMode}`;
    const lastLoadAt = lastPendingLoadByBranch.get(pendingKey) ?? 0;
    if (Date.now() - lastLoadAt > 2000) {
      lastPendingLoadByBranch.set(pendingKey, Date.now());
      sessionTotalRef.current = 0;
      loadPending();
    }
  }, [effectiveBranchId, loadPending, receiveMode]);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCAL SCAN — zero server calls, instant UI update
  // ═══════════════════════════════════════════════════════════════════════════
  const handleScan = useCallback((code: string) => {
    if (isGlobal || !effectiveBranchId) return;
    const normalized = code.trim();
    if (!normalized) return;

    // --- SERIALIZED ---
    const serialMatch = visibleLines
      .filter((line): line is ReceiveSerializedLine => line.type === "serialized")
      .flatMap((line) => line.serialItems.map((serial) => ({ line, serial })))
      .find((e) => e.serial.serialCode === normalized);

    if (serialMatch) {
      const alreadyDone = combinedSerialIds.has(serialMatch.serial.id);
      if (alreadyDone) {
        setLastScanStatus("error");
        addActivity("warning", `Item ya escaneado: ${serialMatch.line.productName}`, normalized);
        return;
      }
      if (serialMatch.line.destinationBranch !== currentBranch) {
        setPendingError({ kind: "serial", itemCode: normalized, expectedBranch: serialMatch.line.destinationBranch, currentBranch, serialId: serialMatch.serial.id });
        setWrongBranchModalOpen(true);
        setLastScannedCode(normalized); setLastScanStatus("error");
        return;
      }
      // ✅ 100% LOCAL — no server call
      if (scanMode === "batch") {
        // Batch mode for serialized: stage ALL pending serials from this group at once
        const parentLine = serialMatch.line;
        const toStage = parentLine.serialItems.filter((s) => !combinedSerialIds.has(s.id));
        if (toStage.length === 0) {
          setLastScanStatus("error");
          addActivity("warning", `Todos los ítems ya escaneados: ${parentLine.productName}`, normalized);
          return;
        }
        setLocalSerialIds((prev) => new Set([...prev, ...toStage.map((s) => s.id)]));
        setLastScannedCode(normalized); setLastScanStatus("success");
        setActiveBatchId(parentLine.id);
        addActivity("success", `✔ Lote serializado completo: ${parentLine.productName} — ${toStage.length} ítem(s)`, normalized);
        return;
      }
      setLocalSerialIds((prev) => new Set(prev).add(serialMatch.serial.id));
      setLastScannedCode(normalized); setLastScanStatus("success");
      addActivity("success", `✔ ${serialMatch.line.productName} · ${serialMatch.serial.serialCode}`, normalized);
      return;
    }

    // --- STOCK ---
    if (!isTransitMode) {
      setLastScanStatus("error");
      addActivity(
        "warning",
        `Solo se recibe serializados en ${receiveModeLabel}`,
        normalized,
      );
      return;
    }

    const stockMatch = visibleLines.find(
      (line): line is ReceiveStockLine =>
        line.type === "stock" && line.scanCodes.some((c) => c === normalized),
    );

    if (!stockMatch) {
      setLastScanStatus("error");
      addActivity("error", `Código no encontrado: ${normalized}`, normalized);
      return;
    }

    const currentCount = combinedStockCounts[stockMatch.id] ?? 0;
    if (currentCount >= stockMatch.quantityExpected) {
      setLastScanStatus("error");
      addActivity("warning", `Cantidad completa: ${stockMatch.productName}`, normalized);
      return;
    }

    if (stockMatch.destinationBranch !== currentBranch) {
      setPendingError({ kind: "stock", itemCode: normalized, expectedBranch: stockMatch.destinationBranch, currentBranch, stockId: stockMatch.id });
      setWrongBranchModalOpen(true);
      setLastScannedCode(normalized); setLastScanStatus("error");
      return;
    }

    if (scanMode === "batch") {
      // Batch mode: auto-stage ALL remaining expected units for this lot at once
      const remaining = stockMatch.quantityExpected - currentCount;
      if (remaining <= 0) {
        setLastScanStatus("error");
        addActivity("warning", `Cantidad completa: ${stockMatch.productName}`, normalized);
        return;
      }
      setLocalStockCounts((prev) => ({ ...prev, [stockMatch.id]: (prev[stockMatch.id] ?? 0) + remaining }));
      setLastScannedCode(normalized); setLastScanStatus("success");
      setActiveBatchId(stockMatch.id); // highlight row
      addActivity(
        "success",
        `✔ Lote completo: ${stockMatch.productName} — ${remaining} unidad(es) staged (${currentCount + remaining}/${stockMatch.quantityExpected})`,
        normalized,
      );
      return;
    }

    // ✅ 100% LOCAL — no server call (single mode: +1 per scan)
    setLocalStockCounts((prev) => ({ ...prev, [stockMatch.id]: (prev[stockMatch.id] ?? 0) + 1 }));
    setLastScannedCode(normalized); setLastScanStatus("success");

    const newTotal = currentCount + 1;
    const isComplete = newTotal >= stockMatch.quantityExpected;
    addActivity(
      "success",
      `${isComplete ? "Completo" : "✔"} ${stockMatch.productName}  ${newTotal}/${stockMatch.quantityExpected}`,
      normalized,
    );
  }, [
    isGlobal,
    effectiveBranchId,
    visibleLines,
    combinedSerialIds,
    combinedStockCounts,
    currentBranch,
    scanMode,
    addActivity,
    isTransitMode,
    receiveModeLabel,
  ]);

  // Accumulate: adds to existing local count (used by Marcar todo button and scan)
  const handleAddLocalStock = useCallback((stockId: string, quantity: number) => {
    const line = visibleLines.find((l): l is ReceiveStockLine => l.type === "stock" && l.id === stockId);
    if (!line) return;
    const current = combinedStockCounts[stockId] ?? 0;
    const maxAdd = line.quantityExpected - current;
    const toAdd = Math.min(Math.max(quantity, 0), maxAdd);
    if (toAdd <= 0) return;
    setLocalStockCounts((prev) => ({ ...prev, [stockId]: (prev[stockId] ?? 0) + toAdd }));
    addActivity("success", `✔ ${line.productName}  ${current + toAdd}/${line.quantityExpected}`, line.variantCode);
  }, [visibleLines, combinedStockCounts, addActivity]);

  // Replace: sets the local count to an explicit value (used by inline qty input)
  const handleSetLocalStock = useCallback((stockId: string, quantity: number) => {
    const line = visibleLines.find((l): l is ReceiveStockLine => l.type === "stock" && l.id === stockId);
    if (!line) return;
    const committedCount = (combinedStockCounts[stockId] ?? 0) - (localStockCounts[stockId] ?? 0);
    const maxAllowed = line.quantityExpected - Math.max(committedCount, 0);
    const clamped = Math.max(0, Math.min(quantity, maxAllowed));
    setLocalStockCounts((prev) => ({ ...prev, [stockId]: clamped }));
  }, [visibleLines, combinedStockCounts, localStockCounts]);

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH COMMIT — sends everything staged to the server in one shot
  // ═══════════════════════════════════════════════════════════════════════════
  const commitAll = useCallback(async () => {
    const hasStock = Object.keys(localStockCounts).some((id) => (localStockCounts[id] ?? 0) > 0);
    const hasSerial = localSerialIds.size > 0;
    if (!hasStock && !hasSerial) {
      toast.info("No hay nada por confirmar");
      return;
    }

    setIsCommitting(true);
    try {
      const results = await Promise.allSettled([
        ...(isTransitMode
          ? Object.entries(localStockCounts)
              .filter(([, qty]) => qty > 0)
              .map(([stockId, quantity]) =>
                receiveStockQuantityAction({ stockId, quantity }).then((r) => ({
                  stockId,
                  quantity,
                  ok: r.success,
                  error: r.error,
                })),
              )
          : []),
        ...Array.from(localSerialIds).map((itemId) =>
          markReceiveAvailableAction({ type: "serialized", itemId }).then((r) => ({
            itemId,
            ok: r.success,
            error: r.error,
          })),
        ),
      ]);

      let successCount = 0; let errorCount = 0;
      const newCommittedStock = { ...committedStockCounts };
      const newCommittedSerials = new Set(committedSerialIds);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const val: CommitResult = result.value;
          if (val.ok) {
            successCount++;
            if ("stockId" in val) {
              newCommittedStock[val.stockId] = (newCommittedStock[val.stockId] ?? 0) + val.quantity;
            } else {
              newCommittedSerials.add(val.itemId);
            }
          } else {
            errorCount++;
            addActivity("error", val.error || "Error al confirmar ítem");
          }
        } else {
          errorCount++;
        }
      });

      // Move confirmed items from local to committed
      setCommittedStockCounts(newCommittedStock);
      setCommittedSerialIds(newCommittedSerials);
      setLocalStockCounts({});
      setLocalSerialIds(new Set());

      if (successCount > 0) addActivity("success", `${successCount} ítem(s) confirmados al servidor`);
      if (errorCount > 0) toast.error(`${errorCount} ítem(s) fallaron al confirmar`);
      else toast.success(`${successCount} ítem(s) recibidos correctamente`);

      // Refresh pending list once after commit (only once)
      sessionTotalRef.current = 0;
      await loadPending();
    } finally {
      setIsCommitting(false);
    }
  }, [
    localStockCounts,
    localSerialIds,
    committedStockCounts,
    committedSerialIds,
    addActivity,
    loadPending,
    isTransitMode,
  ]);

  // Commit a single line (per-row confirm button)
  const commitLine = useCallback(async (lineId: string) => {
    const line = visibleLines.find((l) => l.id === lineId);
    if (!line) return;

    setIsCommitting(true);
    try {
      if (line.type === "stock") {
        if (!isTransitMode) {
          toast.info("Solo se reciben lotes en tránsito");
          return;
        }
        const qty = localStockCounts[lineId] ?? 0;
        if (qty <= 0) { toast.info("Sin cambios por confirmar en esta línea"); return; }
        const result = await receiveStockQuantityAction({ stockId: lineId, quantity: qty });
        if (!result.success) { addActivity("error", result.error || "Error al confirmar", lineId); return; }
        setCommittedStockCounts((prev) => ({ ...prev, [lineId]: (prev[lineId] ?? 0) + qty }));
        setLocalStockCounts((prev) => { const n = { ...prev }; delete n[lineId]; return n; });
        addActivity("success", `${line.productName} — ${qty} unidad(es) confirmadas`, lineId);
      } else {
        const pendingSerials = line.serialItems.filter((s) => localSerialIds.has(s.id));
        if (pendingSerials.length === 0) { toast.info("Sin serializados por confirmar en esta línea"); return; }
        const results = await Promise.allSettled(
          pendingSerials.map((s) => markReceiveAvailableAction({ type: "serialized", itemId: s.id })),
        );
        const confirmed = new Set(committedSerialIds);
        const remaining = new Set(localSerialIds);
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value.success) {
            confirmed.add(pendingSerials[i].id);
            remaining.delete(pendingSerials[i].id);
          }
        });
        setCommittedSerialIds(confirmed);
        setLocalSerialIds(remaining);
        addActivity("success", `${line.productName} — ${pendingSerials.length} ítems confirmados`, lineId);
      }
      sessionTotalRef.current = 0;
      await loadPending();
    } finally {
      setIsCommitting(false);
    }
  }, [
    visibleLines,
    localStockCounts,
    localSerialIds,
    committedSerialIds,
    addActivity,
    loadPending,
    isTransitMode,
  ]);

  // ───────────────────────────────────────────────────────────────────────────
  const handleToggleSerial = useCallback((serialId: string) => {
    const alreadyDone = combinedSerialIds.has(serialId);
    if (alreadyDone) { addActivity("info", "Item ya marcado"); return; }
    setLocalSerialIds((prev) => new Set(prev).add(serialId));
  }, [combinedSerialIds, addActivity]);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setLocalStockCounts({});
      setLocalSerialIds(new Set());
      setCommittedStockCounts({});
      setCommittedSerialIds(new Set());
      addActivity("info", "Todos los items desmarcados");
      return;
    }

    const newStockCounts: Record<string, number> = {};
    const newSerialIds = new Set<string>();

    visibleLines.forEach((line) => {
      if (line.type === "stock") {
        const alreadyCommitted = committedStockCounts[line.id] ?? 0;
        const remaining = line.quantityExpected - alreadyCommitted;
        if (remaining > 0) newStockCounts[line.id] = (localStockCounts[line.id] ?? 0) + remaining;
      } else {
        line.serialItems.forEach((s) => {
          if (!committedSerialIds.has(s.id)) newSerialIds.add(s.id);
        });
      }
    });

    setLocalStockCounts((prev) => ({ ...prev, ...newStockCounts }));
    setLocalSerialIds((prev) => new Set([...prev, ...newSerialIds]));
    addActivity("info", "Todos los items marcados (sin confirmar aún)");
  }, [
    allSelected,
    visibleLines,
    committedStockCounts,
    committedSerialIds,
    localStockCounts,
    addActivity,
  ]);

  const handleCloseAssignment = (action: "mark-lost" | "keep-transit") => {
    visibleLines.forEach((line) => {
      if (line.type === "stock") {
        const received = combinedStockCounts[line.id] ?? 0;
        if (received < line.quantityExpected) {
          addActivity(action === "mark-lost" ? "warning" : "info",
            `${action === "mark-lost" ? "Perdido" : "En tránsito"}: ${line.productName}`, line.variantCode);
        }
      } else {
        line.serialItems.forEach((item) => {
          if (!combinedSerialIds.has(item.id)) {
            addActivity(action === "mark-lost" ? "warning" : "info",
              `${action === "mark-lost" ? "Perdido" : "En tránsito"}: ${line.productName}`, item.serialCode);
          }
        });
      }
    });
    console.log("Cerrando recepción:", action);
  };

  const handleWrongBranchDecision = async (action: "reassign" | "report") => {
    if (!pendingError) return;
    if (action === "reassign") {
      if (pendingError.kind === "serial" && pendingError.serialId) {
        setLocalSerialIds((prev) => new Set(prev).add(pendingError.serialId!));
      }
      if (pendingError.kind === "stock" && pendingError.stockId) {
        const line = visibleLines.find((l): l is ReceiveStockLine => l.type === "stock" && l.id === pendingError.stockId);
        if (line) {
          const current = combinedStockCounts[line.id] ?? 0;
          if (current < line.quantityExpected) {
            setLocalStockCounts((prev) => ({ ...prev, [line.id]: (prev[line.id] ?? 0) + 1 }));
          }
        }
      }
      addActivity("warning", `Reasignado de ${pendingError.expectedBranch} a ${pendingError.currentBranch}`, pendingError.itemCode);
    } else {
      addActivity("error", `Error reportado (esperado: ${pendingError.expectedBranch})`, pendingError.itemCode);
    }
    setPendingError(null);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Sucursal */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              <Store className="h-4 w-4" />Sucursal de recepción
            </p>
            <p className="text-xs text-muted-foreground">
              Valida el stock {receiveModeLabel.toLowerCase()}
            </p>
          </div>
          <div className="w-full md:w-[260px]">
            <Select value={effectiveBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar sucursal" /></SelectTrigger>
              <SelectContent>
                {branchOptions.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Modo de Recepción</p>
            <p className="text-xs text-muted-foreground">
              Mezclado de lavandería y mantenimiento en un solo flujo.
            </p>
          </div>
          <Tabs
            value={receiveMode}
            onValueChange={(value) => {
              setReceiveMode(value as "transit" | "service");
              sessionTotalRef.current = 0;
              setActiveBatchId(null);
            }}
          >
            <TabsList>
              <TabsTrigger value="transit">En tránsito</TabsTrigger>
              <TabsTrigger value="service">Lavandería / Mantenimiento</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Stats */}
      <ReceiveStats
        totalExpected={progressTotalExpected}
        scannedCount={scannedCount}
        pendingCount={pendingCount}
        modeLabel={isTransitMode ? "En tránsito" : "En servicio"}
      />

      {/* Scanner */}
      <ScanInput
        onScan={handleScan}
        isScanning={false}
        disabled={isGlobal || !effectiveBranchId || isLoading}
        lastScannedCode={lastScannedCode}
        lastScanStatus={lastScanStatus}
        scanMode={scanMode}
        onScanModeChange={setScanMode}
      />

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Por Recibir</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingItemsList
            lines={visibleLines}
            receivedSerialIds={combinedSerialIds}
            receivedStockCounts={combinedStockCounts}
            localStockCounts={localStockCounts}
            localSerialIds={localSerialIds}
            onToggleSerial={handleToggleSerial}
            onReceiveStockQuantity={handleAddLocalStock}
            onSetLocalStock={handleSetLocalStock}
            onSelectAll={handleSelectAll}
            onCommitLine={commitLine}
            activeBatchId={activeBatchId}
            isCommitting={isCommitting}
          />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLog activities={activities} />
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm"><span className="font-bold">{scannedCount}</span> recibidos</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              <span className="text-sm"><span className="font-bold">{pendingCount}</span> pendientes</span>
            </div>
            {stagedCount > 0 && (
              <div className="flex items-center space-x-2 text-amber-600">
                <span className="text-sm font-medium">
                  <span className="font-bold">{stagedCount}</span> escaneados sin confirmar
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {stagedCount > 0 && (
              <Button
                onClick={commitAll}
                disabled={isCommitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCommitting
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Confirmando...</>
                  : <>Confirmar todo ({stagedCount})</>}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setCloseModalOpen(true)}
              disabled={scannedCount === 0}
            >
              Cerrar Recepción
            </Button>
            <Button>Reportar Novedad</Button>
          </div>
        </div>
      </Card>

      <CloseReceiveModal
        open={closeModalOpen}
        onOpenChange={setCloseModalOpen}
        pendingCount={pendingCount}
        modeLabel={isTransitMode ? "en tránsito" : "en servicio"}
        onConfirm={handleCloseAssignment}
      />
      <WrongBranchModal
        open={wrongBranchModalOpen}
        onOpenChange={setWrongBranchModalOpen}
        itemCode={pendingError?.itemCode || ""}
        expectedBranch={pendingError?.expectedBranch || ""}
        currentBranch={pendingError?.currentBranch || ""}
        onConfirm={handleWrongBranchDecision}
      />
    </div>
  );
};
