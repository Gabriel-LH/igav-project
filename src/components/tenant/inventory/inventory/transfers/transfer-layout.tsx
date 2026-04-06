"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransferForm, TransferFormData } from "./transfer-form";
import { TransfersTable } from "./table/transfer-table";
import { Truck, History } from "lucide-react";
import type { Transfer } from "./table/transfer-table";
import {
  approveTransferAction,
  cancelTransferAction,
  createTransferAction,
  listTransfersAction,
} from "@/src/app/(tenant)/tenant/actions/transfer.actions";
import { toast } from "sonner";
import { getBranchInventoryAction } from "@/src/app/(tenant)/tenant/actions/inventory.actions";
import { GLOBAL_BRANCH_ID, useBranchStore } from "@/src/store/useBranchStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";

export function TransferLayout() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [activeTab, setActiveTab] = useState("new");
  const [isLoading, setIsLoading] = useState(true);
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
  const setInventoryItems = useInventoryStore((state) => state.setInventoryItems);
  const setStockLots = useInventoryStore((state) => state.setStockLots);

  const refreshCurrentBranchInventory = async () => {
    if (!selectedBranchId || selectedBranchId === GLOBAL_BRANCH_ID) return;

    const inventoryResult = await getBranchInventoryAction(selectedBranchId);
    if (!inventoryResult.success || !inventoryResult.data) return;

    setInventoryItems(inventoryResult.data.inventoryItems as never[]);
    setStockLots(inventoryResult.data.stockLots as never[]);
  };

  useEffect(() => {
    async function loadTransfers() {
      setIsLoading(true);
      try {
        const result = await listTransfersAction();
        if (result.success && result.data) {
          setTransfers(result.data as Transfer[]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadTransfers();
  }, []);

  const handleCreateTransfer = async (formData: TransferFormData) => {
    const result = await createTransferAction(formData);
    if (!result.success) {
      toast.error(result.error || "No se pudo crear la transferencia.");
      return;
    }

    setTransfers((result.data ?? []) as Transfer[]);
    await refreshCurrentBranchInventory();
    setActiveTab("history");
    toast.success(
      formData.requiresApproval
        ? "Transferencia registrada como pendiente de aprobacion."
        : "Transferencia enviada a transito correctamente.",
    );
  };

  const handleApprove = async (id: string) => {
    const result = await approveTransferAction(id);
    if (!result.success) {
      toast.error(result.error || "No se pudo aprobar la transferencia.");
      return;
    }

    setTransfers((result.data ?? []) as Transfer[]);
    await refreshCurrentBranchInventory();
    toast.success("Transferencia aprobada y enviada a transito.");
  };

  const handleCancel = async (id: string) => {
    const result = await cancelTransferAction(id);
    if (!result.success) {
      toast.error(result.error || "No se pudo cancelar la transferencia.");
      return;
    }

    setTransfers((result.data ?? []) as Transfer[]);
    toast.success("Transferencia cancelada.");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
        Cargando transferencias...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="new" className="gap-2">
            <Truck className="w-4 h-4" />
            Nueva Transferencia
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          <TransferForm onSubmit={handleCreateTransfer} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <TransfersTable
            transfers={transfers}
            onApprove={handleApprove}
            onCancel={handleCancel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
