"use client"
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ReceiveStats } from "./ui/ReceiveStats";
import { PendingItemsList } from "./ui/PendingItemsList";
import { ActivityLog } from "./ui/ActivityLog";
import { ScanInput } from "./ui/ScanInput";
import { CloseReceiveModal } from "./ui/CloseReceiveModal";
import { WrongBranchModal } from "./ui/WronBranchModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { CheckCircle, Store, XCircle } from "lucide-react";
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
import { Product } from "@/src/types/product/type.product";
import { ProductVariant } from "@/src/types/product/type.productVariant";

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
};

type ReceiveSerializedLine = {
  id: string;
  type: "serialized";
  productName: string;
  variantName: string;
  variantCode: string;
  destinationBranch: string;
  serialItems: Array<{
    id: string;
    serialCode: string;
  }>;
  image?: string;
};

type ReceiveLine = ReceiveStockLine | ReceiveSerializedLine;

const MOCK_BRANCHES = [
  { id: "branch-1", name: "Sucursal Miraflores" },
  { id: "branch-2", name: "Sucursal San Isidro" },
  { id: "branch-3", name: "Sucursal Surco" },
];


interface Activity {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  itemCode?: string;
  timestamp: Date;
}

export const ReceiveModule: React.FC = () => {
  // Estados principales
  const [receiveLines, setReceiveLines] = useState<ReceiveLine[]>([]);
  const [receivedSerialIds, setReceivedSerialIds] = useState<Set<string>>(
    new Set(),
  );
  const [receivedStockCounts, setReceivedStockCounts] = useState<
    Record<string, number>
  >({});
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>();
  const [lastScanStatus, setLastScanStatus] = useState<"success" | "error">();
  const storeBranches = useBranchStore((state) => state.branches);
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
  const setSelectedBranchId = useBranchStore(
    (state) => state.setSelectedBranchId,
  );
  const canUseGlobal = useBranchStore((state) => state.canUseGlobal);
  const branches = storeBranches.length > 0 ? storeBranches : MOCK_BRANCHES;
  const branchOptions = useMemo(
    () =>
      canUseGlobal
        ? [{ id: GLOBAL_BRANCH_ID, name: "Global" }, ...branches]
        : branches,
    [canUseGlobal, branches],
  );

  // Estados para modales
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

  const effectiveBranchId = selectedBranchId || branches[0]?.id || "";
  const isGlobal = canUseGlobal && selectedBranchId === GLOBAL_BRANCH_ID;

  const currentBranch = useMemo(() => {
    if (isGlobal) return "Global";
    return (
      branchOptions.find((branch) => branch.id === effectiveBranchId)?.name ??
      "Sucursal"
    );
  }, [branchOptions, effectiveBranchId, isGlobal]);

  // Cálculos
  const totalExpected = useMemo(() => {
    return receiveLines.reduce((total, line) => {
      if (line.type === "stock") {
        return total + line.quantityExpected;
      }
      return total + line.serialItems.length;
    }, 0);
  }, [receiveLines]);

  const scannedCount = useMemo(() => {
    const stockCount = Object.values(receivedStockCounts).reduce(
      (sum, value) => sum + value,
      0,
    );
    return stockCount + receivedSerialIds.size;
  }, [receivedSerialIds, receivedStockCounts]);

  const pendingCount = Math.max(totalExpected - scannedCount, 0);
  const allSelected = totalExpected > 0 && scannedCount === totalExpected;

  // Función para agregar actividad
  const addActivity = useCallback((
    type: Activity["type"],
    message: string,
    itemCode?: string,
  ) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      type,
      message,
      itemCode,
      timestamp: new Date(),
    };
    setActivities((prev) => [newActivity, ...prev].slice(0, 50)); // Mantener últimas 50
  }, []);

  const branchNameById = useMemo(() => {
    return new Map(branches.map((branch) => [branch.id, branch.name]));
  }, [branches]);

  const formatVariantName = useCallback((variant?: ProductVariant) => {
    if (!variant) return "Variante";
    const values = Object.values(variant.attributes || {});
    if (values.length > 0) return values.join(" / ");
    return variant.variantCode;
  }, []);

  const loadPending = useCallback(async () => {
    if (!effectiveBranchId || isGlobal) {
      setReceiveLines([]);
      setReceivedSerialIds(new Set());
      setReceivedStockCounts({});
      return;
    }

    setIsLoading(true);
    const [pendingResult, productsResult] = await Promise.all([
      listReceivePendingAction({ branchId: effectiveBranchId }),
      getProductsAction(),
    ]);

    if (!pendingResult.success || !pendingResult.data) {
      addActivity(
        "error",
        pendingResult.error || "No se pudo cargar pendientes de recepción",
      );
      setReceiveLines([]);
      setIsLoading(false);
      return;
    }

    const products: Product[] = productsResult.success
      ? productsResult.data?.products ?? []
      : [];
    const variants: ProductVariant[] = productsResult.success
      ? productsResult.data?.variants ?? []
      : [];

    const productMap = new Map(products.map((p) => [p.id, p]));
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const stockLines: ReceiveLine[] = pendingResult.data.stockLots.map(
      (lot) => {
        const product = productMap.get(lot.productId);
        const variant = variantMap.get(lot.variantId);
        const branchName =
          branchNameById.get(lot.branchId) || lot.branchId;
        const scanCodes = [
          lot.barcode,
          variant?.barcode,
          lot.id,
          variant?.variantCode,
        ].filter(Boolean) as string[];

        return {
          id: lot.id,
          type: "stock",
          productName: product?.name || lot.productId,
          variantName: formatVariantName(variant),
          variantCode: variant?.variantCode || lot.variantId,
          destinationBranch: branchName,
          quantityExpected: lot.quantity,
          scanCodes,
        };
      },
    );

    const serializedMap = new Map<string, ReceiveSerializedLine>();
    pendingResult.data.serializedItems.forEach((item) => {
      const product = productMap.get(item.productId);
      const variant = variantMap.get(item.variantId);
      const branchName =
        branchNameById.get(item.branchId) || item.branchId;
      const key = `${item.variantId}:${item.branchId}`;

      if (!serializedMap.has(key)) {
        serializedMap.set(key, {
          id: `serial-${key}`,
          type: "serialized",
          productName: product?.name || item.productId,
          variantName: formatVariantName(variant),
          variantCode: variant?.variantCode || item.variantId,
          destinationBranch: branchName,
          serialItems: [],
        });
      }

      serializedMap.get(key)!.serialItems.push({
        id: item.id,
        serialCode: item.serialCode,
      });
    });

    setReceiveLines([...stockLines, ...Array.from(serializedMap.values())]);
    setReceivedSerialIds(new Set());
    setReceivedStockCounts({});
    setIsLoading(false);
  }, [
    addActivity,
    branchNameById,
    effectiveBranchId,
    formatVariantName,
    isGlobal,
  ]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  // Manejar escaneo
  const handleScan = async (code: string) => {
    if (isScanning || isGlobal || !effectiveBranchId) return;
    setIsScanning(true);

    try {
      const normalized = code.trim();

      const serialMatch = receiveLines
        .filter((line): line is ReceiveSerializedLine => line.type === "serialized")
        .flatMap((line) =>
          line.serialItems.map((serial) => ({
            line,
            serial,
          })),
        )
        .find((entry) => entry.serial.serialCode === normalized);

      if (serialMatch) {
        if (receivedSerialIds.has(serialMatch.serial.id)) {
          setLastScanStatus("error");
          addActivity(
            "warning",
            `Item ya escaneado: ${serialMatch.line.productName}`,
            normalized,
          );
          return;
        }

        if (serialMatch.line.destinationBranch !== currentBranch) {
          setPendingError({
            kind: "serial",
            itemCode: normalized,
            expectedBranch: serialMatch.line.destinationBranch,
            currentBranch,
            serialId: serialMatch.serial.id,
          });
          setWrongBranchModalOpen(true);
          setLastScannedCode(normalized);
          setLastScanStatus("error");
          return;
        }

        const updateResult = await markReceiveAvailableAction({
          type: "serialized",
          itemId: serialMatch.serial.id,
        });

        if (!updateResult.success) {
          setLastScanStatus("error");
          addActivity(
            "error",
            updateResult.error || "No se pudo actualizar el serializado",
            normalized,
          );
          return;
        }

        setReceivedSerialIds((prev) => new Set(prev).add(serialMatch.serial.id));
        setLastScannedCode(normalized);
        setLastScanStatus("success");
        addActivity(
          "success",
          `Item serializado disponible: ${serialMatch.line.productName}`,
          normalized,
        );
        loadPending();
        return;
      }

      const stockMatch = receiveLines.find(
        (line): line is ReceiveStockLine =>
          line.type === "stock" &&
          line.scanCodes.some((scanCode) => scanCode === normalized),
      );

      if (!stockMatch) {
        setLastScanStatus("error");
        addActivity("error", `Código no encontrado: ${normalized}`, normalized);
        return;
      }

      const currentCount = receivedStockCounts[stockMatch.id] ?? 0;
      if (currentCount >= stockMatch.quantityExpected) {
        setLastScanStatus("error");
        addActivity(
          "warning",
          `Cantidad completa para ${stockMatch.productName}`,
          normalized,
        );
        return;
      }

      if (stockMatch.destinationBranch !== currentBranch) {
        setPendingError({
          kind: "stock",
          itemCode: normalized,
          expectedBranch: stockMatch.destinationBranch,
          currentBranch,
          stockId: stockMatch.id,
        });
        setWrongBranchModalOpen(true);
        setLastScannedCode(normalized);
        setLastScanStatus("error");
        return;
      }

      const updateResult = await receiveStockQuantityAction({
        stockId: stockMatch.id,
        quantity: 1,
      });

      if (!updateResult.success) {
        setLastScanStatus("error");
        addActivity(
          "error",
          updateResult.error || "No se pudo actualizar el stock",
          normalized,
        );
        return;
      }

      const nextCount = currentCount + 1;
      setReceivedStockCounts((prev) => ({
        ...prev,
        [stockMatch.id]: nextCount,
      }));
      setLastScannedCode(normalized);
      setLastScanStatus("success");
      addActivity(
        "success",
        `Stock recibido: ${stockMatch.productName}`,
        normalized,
      );
      loadPending();
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleSerial = (serialId: string) => {
    const serialEntry = receiveLines
      .filter((line): line is ReceiveSerializedLine => line.type === "serialized")
      .flatMap((line) =>
        line.serialItems.map((serial) => ({
          line,
          serial,
        })),
      )
      .find((entry) => entry.serial.id === serialId);

    if (!serialEntry) return;

    if (receivedSerialIds.has(serialId)) {
      addActivity(
        "info",
        `Item ya está disponible: ${serialEntry.line.productName}`,
        serialEntry.serial.serialCode,
      );
      return;
    }

    markReceiveAvailableAction({
      type: "serialized",
      itemId: serialId,
    }).then((result) => {
      if (!result.success) {
        addActivity(
          "error",
          result.error || "No se pudo actualizar el serializado",
          serialEntry.serial.serialCode,
        );
        return;
      }

      setReceivedSerialIds((prev) => new Set(prev).add(serialId));
      addActivity(
        "success",
        `Item marcado manualmente: ${serialEntry.line.productName}`,
        serialEntry.serial.serialCode,
      );
      loadPending();
    });
  };

  const handleReceiveStockQuantity = (
    stockId: string,
    quantity: number,
  ) => {
    const line = receiveLines.find(
      (item): item is ReceiveStockLine =>
        item.type === "stock" && item.id === stockId,
    );
    if (!line) return;

    const current = receivedStockCounts[stockId] ?? 0;
    const next = Math.min(
      Math.max(current + quantity, 0),
      line.quantityExpected,
    );
    if (next === current || quantity <= 0) {
      return;
    }

    const registerActivity = () => {
      addActivity(
        "success",
        `Stock recibido: ${line.productName}`,
        line.variantCode,
      );
    };

    receiveStockQuantityAction({
      stockId: line.id,
      quantity: next - current,
    }).then((result) => {
      if (!result.success) {
        addActivity(
          "error",
          result.error || "No se pudo actualizar el stock",
          line.variantCode,
        );
        return;
      }
      setReceivedStockCounts((prev) => ({
        ...prev,
        [stockId]: next,
      }));
      registerActivity();
      loadPending();
    });
  };

  // Manejar seleccionar todos
  const handleSelectAll = () => {
    if (allSelected) {
      setReceivedSerialIds(new Set());
      setReceivedStockCounts({});
      addActivity("info", "Todos los items desmarcados");
      return;
    }

    const serialIds = receiveLines
      .filter((line): line is ReceiveSerializedLine => line.type === "serialized")
      .flatMap((line) => line.serialItems.map((item) => item.id));
    const stockLines = receiveLines.filter(
      (line): line is ReceiveStockLine => line.type === "stock",
    );

    Promise.all([
      ...serialIds.map((id) =>
        markReceiveAvailableAction({ type: "serialized", itemId: id }),
      ),
      ...stockLines.map((line) =>
        receiveStockQuantityAction({
          stockId: line.id,
          quantity: line.quantityExpected,
        }),
      ),
    ]).then((results) => {
      const hasErrors = results.some((res) => !res.success);
      if (hasErrors) {
        addActivity(
          "error",
          "Algunos items no pudieron marcarse como disponibles",
        );
        return;
      }

      const allSerials = new Set(serialIds);
      const allStockCounts = stockLines.reduce<Record<string, number>>(
        (acc, line) => {
          acc[line.id] = line.quantityExpected;
          return acc;
        },
        {},
      );

      setReceivedSerialIds(allSerials);
      setReceivedStockCounts(allStockCounts);
      addActivity("success", "Todos los items marcados como recibidos");
      loadPending();
    });
  };

  // Manejar cierre de recepción
  const handleCloseAssignment = (action: "mark-lost" | "keep-transit") => {
    if (action === "mark-lost") {
      // Marcar pendientes como perdidos
      receiveLines.forEach((line) => {
        if (line.type === "stock") {
          const received = receivedStockCounts[line.id] ?? 0;
          if (received < line.quantityExpected) {
            addActivity(
              "warning",
              `Stock marcado como perdido: ${line.productName}`,
              line.variantCode,
            );
          }
          return;
        }

        line.serialItems.forEach((item) => {
          if (!receivedSerialIds.has(item.id)) {
            addActivity(
              "warning",
              `Item marcado como perdido: ${line.productName}`,
              item.serialCode,
            );
          }
        });
      });
    } else {
      // Mantener en tránsito
      receiveLines.forEach((line) => {
        if (line.type === "stock") {
          const received = receivedStockCounts[line.id] ?? 0;
          if (received < line.quantityExpected) {
            addActivity(
              "info",
              `Stock mantenido en tránsito: ${line.productName}`,
              line.variantCode,
            );
          }
          return;
        }

        line.serialItems.forEach((item) => {
          if (!receivedSerialIds.has(item.id)) {
            addActivity(
              "info",
              `Item mantenido en tránsito: ${line.productName}`,
              item.serialCode,
            );
          }
        });
      });
    }

    // Aquí iría la llamada a la API
    console.log("Cerrando recepción con acción:", action);
  };

  // Manejar decisión de sucursal equivocada
  const handleWrongBranchDecision = async (
    action: "reassign" | "report",
  ) => {
    if (!pendingError) return;

    if (action === "reassign") {
      if (pendingError.kind === "serial" && pendingError.serialId) {
        const updateResult = await markReceiveAvailableAction({
          type: "serialized",
          itemId: pendingError.serialId,
        });

        if (!updateResult.success) {
          addActivity(
            "error",
            updateResult.error || "No se pudo actualizar el serializado",
            pendingError.itemCode,
          );
          setPendingError(null);
          return;
        }

        setReceivedSerialIds((prev) =>
          new Set(prev).add(pendingError.serialId!),
        );
      }

      if (pendingError.kind === "stock" && pendingError.stockId) {
        const line = receiveLines.find(
          (item): item is ReceiveStockLine =>
            item.type === "stock" && item.id === pendingError.stockId,
        );
        if (line) {
          const current = receivedStockCounts[line.id] ?? 0;
          const next = Math.min(current + 1, line.quantityExpected);
          const updateResult = await receiveStockQuantityAction({
            stockId: line.id,
            quantity: 1,
          });

          if (!updateResult.success) {
            addActivity(
              "error",
              updateResult.error || "No se pudo actualizar el stock",
              pendingError.itemCode,
            );
            setPendingError(null);
            return;
          }

          setReceivedStockCounts((prev) => ({
            ...prev,
            [line.id]: next,
          }));
          loadPending();
        }
      }

      addActivity(
        "warning",
        `Item reasignado de ${pendingError.expectedBranch} a ${pendingError.currentBranch}`,
        pendingError.itemCode,
      );
    } else {
      // Reportar error
      addActivity(
        "error",
        `Error de envío reportado (esperado: ${pendingError.expectedBranch})`,
        pendingError.itemCode,
      );
    }

    setPendingError(null);
  };

  return (
    <div className="space-y-6">
      {/* Selector de sucursal */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              <Store className="h-4 w-4" />
              Sucursal de recepción
            </p>
            <p className="text-xs text-muted-foreground">
              Se usa para validar el stock que llega en tránsito
            </p>
          </div>
          <div className="w-full md:w-[260px]">
            <Select value={effectiveBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <ReceiveStats
        totalExpected={totalExpected}
        scannedCount={scannedCount}
        pendingCount={pendingCount}
      />

      {/* Scan Input */}
      <ScanInput
        onScan={handleScan}
        isScanning={isScanning}
        disabled={isGlobal || !effectiveBranchId || isLoading}
        lastScannedCode={lastScannedCode}
        lastScanStatus={lastScanStatus}
      />

      {/* Tabs principales */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Por Recibir</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingItemsList
            lines={receiveLines}
            receivedSerialIds={receivedSerialIds}
            receivedStockCounts={receivedStockCounts}
            onToggleSerial={handleToggleSerial}
            onReceiveStockQuantity={handleReceiveStockQuantity}
            onSelectAll={handleSelectAll}
          />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLog activities={activities} />
        </TabsContent>
      </Tabs>

      {/* Botones de acción */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">
                <span className="font-bold">{scannedCount}</span> asignados
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              <span className="text-sm">
                <span className="font-bold">{pendingCount}</span> pendientes
              </span>
            </div>
          </div>

          <div className="space-x-2">
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

      {/* Modales */}
      <CloseReceiveModal
        open={closeModalOpen}
        onOpenChange={setCloseModalOpen}
        pendingCount={pendingCount}
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
