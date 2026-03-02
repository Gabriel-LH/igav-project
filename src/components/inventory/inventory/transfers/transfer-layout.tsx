"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransferForm, TransferFormData } from "./transfer-form";
import { TransfersTable, Transfer } from "./transfer-table";
import { Truck, History, Package } from "lucide-react";

// Mock inicial de transferencias
const INITIAL_TRANSFERS: Transfer[] = [
  {
    id: "trf-1",
    referenceNumber: "TRF-2024-001",
    fromBranchName: "Sucursal Central",
    toBranchName: "Sucursal Norte",
    fromBranchAddress: "Av. Principal 123",
    toBranchAddress: "Calle Norte 456",
    status: "en_transito",
    priority: "alta",
    scheduledDate: "2024-12-20",
    createdAt: new Date("2024-12-15"),
    items: [
      {
        id: "item-1",
        productName: "iPhone 15 Pro",
        variantName: "Negro / 128GB",
        isSerial: false,
        quantity: 5,
        condition: "Nuevo",
      },
      {
        id: "item-2",
        productName: "Vestido de Gala Élite",
        variantName: "Rojo / M",
        isSerial: true,
        serialCode: "ITEM-VEST-ABC123-001",
        quantity: 1,
        condition: "Nuevo",
      },
    ],
    totalItems: 6,
    serialCount: 1,
    notes: "Transferencia urgente para evento corporativo",
    requiresApproval: false,
  },
  {
    id: "trf-2",
    referenceNumber: "TRF-2024-002",
    fromBranchName: "Almacén Principal",
    toBranchName: "Sucursal Sur",
    fromBranchAddress: "Zona Industrial",
    toBranchAddress: "Av. Sur 789",
    status: "pendiente",
    priority: "normal",
    scheduledDate: "2024-12-25",
    createdAt: new Date("2024-12-18"),
    items: [
      {
        id: "item-3",
        productName: "Vestido de Gala Élite",
        variantName: "Azul / S",
        isSerial: true,
        serialCode: "ITEM-VEST-DEF456-001",
        quantity: 1,
        condition: "Nuevo",
      },
    ],
    totalItems: 1,
    serialCount: 1,
    requiresApproval: true,
  },
];

export function TransferLayout() {
  const [transfers, setTransfers] = useState<Transfer[]>(INITIAL_TRANSFERS);
  const [activeTab, setActiveTab] = useState("new");

  const handleCreateTransfer = (formData: TransferFormData) => {
    const fromBranch = {
      name: "Sucursal Central", // Esto vendría de un lookup real
      address: "Av. Principal 123",
    };
    const toBranch = {
      name: "Sucursal Norte",
      address: "Calle Norte 456",
    };

    const newTransfer: Transfer = {
      id: `trf-${Date.now()}`,
      referenceNumber: formData.referenceNumber,
      fromBranchName: fromBranch.name,
      toBranchName: toBranch.name,
      fromBranchAddress: fromBranch.address,
      toBranchAddress: toBranch.address,
      status: formData.requiresApproval ? "pendiente" : "pendiente",
      priority: formData.priority,
      scheduledDate: formData.scheduledDate,
      createdAt: new Date(),
      items: formData.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantName: item.variantName,
        isSerial: item.isSerial,
        serialCode: item.serialCode,
        quantity: item.quantity,
        condition: item.condition,
      })),
      totalItems: formData.items.reduce((acc, item) => acc + item.quantity, 0),
      serialCount: formData.items.filter((i) => i.isSerial).length,
      notes: formData.notes,
      requiresApproval: formData.requiresApproval,
    };

    setTransfers((prev) => [newTransfer, ...prev]);
    setActiveTab("history");
  };

  const handleApprove = (id: string) => {
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              approvedBy: "Usuario Actual",
              approvedAt: new Date(),
              status: "en_transito",
            }
          : t,
      ),
    );
  };

  const handleCancel = (id: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "cancelada" } : t)),
    );
  };

  return (
    <div className="p-6 space-y-6">
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
