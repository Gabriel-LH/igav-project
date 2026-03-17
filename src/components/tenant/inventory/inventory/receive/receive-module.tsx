"use client"
import React, { useState } from "react";
import { ReceiveStats } from "./ui/ReceiveStats";
import { PendingItemsList } from "./ui/PendingItemsList";
import { ActivityLog } from "./ui/ActivityLog";
import { ScanInput } from "./ui/ScanInput";
import { CloseReceiveModal } from "./ui/CloseReceiveModal";
import { WrongBranchModal } from "./ui/WronBranchModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

// Mocks (esto vendría de tu API)
const MOCK_PENDING_ITEMS = [
  {
    id: "1",
    code: "PROD-001",
    name: "Camisa Blanca",
    size: "M",
    color: "Blanco",
    destinationBranch: "Sucursal Miraflores",
    status: "pending" as const,
  },
  {
    id: "2",
    code: "PROD-002",
    name: "Pantalon Negro",
    size: "L",
    color: "Negro",
    destinationBranch: "Sucursal Miraflores",
    status: "pending" as const,
  },
  {
    id: "3",
    code: "PROD-003",
    name: "Vestido Rojo",
    size: "S",
    color: "Rojo",
    destinationBranch: "Sucursal San Isidro",
    status: "pending" as const,
  },
  {
    id: "4",
    code: "PROD-004",
    name: "Zapatos Cafe",
    size: "42",
    color: "Café",
    destinationBranch: "Sucursal Miraflores",
    status: "pending" as const,
  },
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
  const [pendingItems, setPendingItems] = useState(MOCK_PENDING_ITEMS);
  const [scannedItems, setScannedItems] = useState<Set<string>>(new Set());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [scanMode, setScanMode] = useState<"auto" | "manual">("auto");
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>();
  const [lastScanStatus, setLastScanStatus] = useState<"success" | "error">();

  // Estados para modales
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [wrongBranchModalOpen, setWrongBranchModalOpen] = useState(false);
  const [pendingError, setPendingError] = useState<{
    itemCode: string;
    expectedBranch: string;
    currentBranch: string;
  } | null>(null);

  // Cálculos
  const totalExpected = pendingItems.length;
  const scannedCount = scannedItems.size;
  const pendingCount = totalExpected - scannedCount;

  // Función para agregar actividad
  const addActivity = (
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
  };

  // Manejar escaneo
  const handleScan = async (code: string) => {
    setIsScanning(true);

    // Simular validación
    setTimeout(() => {
      const item = pendingItems.find((i) => i.code === code);

      if (!item) {
        // Código no encontrado
        setLastScanStatus("error");
        addActivity("error", `Código no encontrado: ${code}`, code);
        setIsScanning(false);
        return;
      }

      // Verificar si ya fue escaneado
      if (scannedItems.has(item.id)) {
        setLastScanStatus("error");
        addActivity("warning", `Item ya escaneado: ${item.name}`, code);
        setIsScanning(false);
        return;
      }

      // Verificar sucursal (ejemplo: siempre validamos contra "Miraflores")
      const currentBranch = "Sucursal Miraflores"; // Esto vendría del contexto
      if (item.destinationBranch !== currentBranch) {
        setPendingError({
          itemCode: code,
          expectedBranch: item.destinationBranch,
          currentBranch,
        });
        setWrongBranchModalOpen(true);
        setIsScanning(false);
        return;
      }

      // Éxito
      setScannedItems((prev) => new Set(prev).add(item.id));
      setLastScannedCode(code);
      setLastScanStatus("success");
      addActivity("success", `Item asignado: ${item.name}`, code);

      setIsScanning(false);
    }, 300);
  };

  // Manejar selección manual de items
  const handleItemSelect = (itemId: string) => {
    const newScanned = new Set(scannedItems);
    if (newScanned.has(itemId)) {
      newScanned.delete(itemId);
      const item = pendingItems.find((i) => i.id === itemId);
      addActivity("info", `Item desmarcado: ${item?.name}`, item?.code);
    } else {
      newScanned.add(itemId);
      const item = pendingItems.find((i) => i.id === itemId);
      addActivity(
        "success",
        `Item marcado manualmente: ${item?.name}`,
        item?.code,
      );
    }
    setScannedItems(newScanned);
  };

  // Manejar seleccionar todos
  const handleSelectAll = () => {
    if (scannedItems.size === pendingItems.length) {
      setScannedItems(new Set());
      addActivity("info", "Todos los items desmarcados");
    } else {
      const allIds = new Set(pendingItems.map((i) => i.id));
      setScannedItems(allIds);
      addActivity(
        "success",
        `${pendingItems.length} items marcados como recibidos`,
      );
    }
  };

  // Manejar cierre de recepción
  const handleCloseAssignment = (action: "mark-lost" | "keep-transit") => {
    if (action === "mark-lost") {
      // Marcar pendientes como perdidos
      const lostItems = pendingItems.filter((i) => !scannedItems.has(i.id));
      lostItems.forEach((item) => {
        addActivity(
          "warning",
          `Item marcado como perdido: ${item.name}`,
          item.code,
        );
      });
    } else {
      // Mantener en tránsito
      const transitItems = pendingItems.filter((i) => !scannedItems.has(i.id));
      transitItems.forEach((item) => {
        addActivity(
          "info",
          `Item mantenido en tránsito: ${item.name}`,
          item.code,
        );
      });
    }

    // Aquí iría la llamada a la API
    console.log("Cerrando recepción con acción:", action);
  };

  // Manejar decisión de sucursal equivocada
  const handleWrongBranchDecision = (action: "reassign" | "report") => {
    if (pendingError) {
      const item = pendingItems.find((i) => i.code === pendingError.itemCode);

      if (action === "reassign") {
        // Reasignar a sucursal actual
        setScannedItems((prev) => new Set(prev).add(item!.id));
        addActivity(
          "warning",
          `Item reasignado de ${pendingError.expectedBranch} a ${pendingError.currentBranch}`,
          pendingError.itemCode,
        );
      } else {
        // Reportar error
        addActivity(
          "error",
          `Error de envío reportado: ${item?.name} (esperado: ${pendingError.expectedBranch})`,
          pendingError.itemCode,
        );
      }

      setPendingError(null);
    }
  };

  return (
    <div className="space-y-6">
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
        mode={scanMode}
        onModeChange={setScanMode}
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
            items={pendingItems}
            scannedItems={scannedItems}
            onItemSelect={handleItemSelect}
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
