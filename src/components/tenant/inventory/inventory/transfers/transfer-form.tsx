// components/inventory/transfer/TransferForm.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useBranchStore } from "@/src/store/useBranchStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useAttributeStore } from "@/src/store/useAttributeStore";
import {
  useTenantConfigStore,
  DEFAULT_CONFIG,
} from "@/src/store/useTenantConfigStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRightLeft,
  Package,
  MapPin,
  ScanLine,
  Plus,
  Trash2,
  Minus,
  Plus as PlusIcon,
  AlertCircle,
  CheckCircle2,
  Barcode,
  QrCode,
  Hash,
  Store,
  Calendar,
  Truck,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarcodeScanner } from "../barcode/Scanner";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
import { getBranchInventoryAction } from "@/src/app/(tenant)/tenant/actions/inventory.actions";
import type { Product } from "@/src/types/product/type.product";
import type { ProductVariant } from "@/src/types/product/type.productVariant";
import type { InventoryItem } from "@/src/types/product/type.inventoryItem";
import type { StockLot } from "@/src/types/product/type.stockLote";

// Tipos
export interface TransferItem {
  id: string;
  stockId?: string; // Para items no serializados (lote)
  itemId?: string; // Para items serializados
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  variantCode: string;
  isSerial: boolean;
  serialCode?: string; // Solo para serializados
  quantity: number; // Para no serializados
  barcode: string;
  condition: string;
  fromBranchId: string;
}

export interface TransferFormData {
  fromBranchId: string;
  toBranchId: string;
  referenceNumber: string;
  notes: string;
  scheduledDate: string;
  items: TransferItem[];
  priority: "baja" | "normal" | "alta" | "urgente";
  requiresApproval: boolean;
}

type AvailableStockItem = {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName?: string;
  variantCode: string;
  barcode: string;
  isSerial: boolean;
  serialCode?: string;
  quantity: number;
  branchId: string;
  condition: string;
};

interface TransferFormProps {
  onSubmit: (data: TransferFormData) => void;
}

// Componente de escaneo
function StockScanner({
  onScan,
  availableStock,
}: {
  onScan: (stock: AvailableStockItem) => void;
  availableStock: AvailableStockItem[];
}) {
  const [error, setError] = useState<string | null>(null);

  const handleScannedCode = (code: string) => {
    setError(null);
    const found = availableStock.find(
      (s) => s.barcode === code || s.serialCode === code,
    );
    if (found) {
      onScan(found);
    } else {
      setError("Código no encontrado en stock disponible");
    }
  };

  return (
    <div className="space-y-4">
      <BarcodeScanner onScan={handleScannedCode} />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export function TransferForm({ onSubmit }: TransferFormProps) {
  const { branches } = useBranchStore();
  const { products, productVariants, inventoryItems, stockLots } =
    useInventoryStore();
  const { getSizeById, getColorById } = useAttributeStore();
  const { config, ensureLoaded } = useTenantConfigStore();

  const [formData, setFormData] = useState<Partial<TransferFormData>>({
    referenceNumber: `TRF-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    scheduledDate: new Date().toISOString().split("T")[0],
    items: [],
    priority: "normal",
    requiresApproval: false,
    fromBranchId: "",
  });

  const [scanMessage, setScanMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [originProducts, setOriginProducts] = useState<Product[]>([]);
  const [originVariants, setOriginVariants] = useState<ProductVariant[]>([]);
  const [originInventoryItems, setOriginInventoryItems] = useState<
    InventoryItem[]
  >([]);
  const [originStockLots, setOriginStockLots] = useState<StockLot[]>([]);
  const [isLoadingOriginInventory, setIsLoadingOriginInventory] =
    useState(false);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  useEffect(() => {
    let cancelled = false;

    async function loadOriginInventory() {
      if (!formData.fromBranchId) {
        setOriginProducts([]);
        setOriginVariants([]);
        setOriginInventoryItems([]);
        setOriginStockLots([]);
        return;
      }

      setIsLoadingOriginInventory(true);
      try {
        const result = await getBranchInventoryAction(formData.fromBranchId);
        if (cancelled) return;

        if (!result.success || !result.data) {
          setOriginProducts([]);
          setOriginVariants([]);
          setOriginInventoryItems([]);
          setOriginStockLots([]);
          return;
        }

        setOriginProducts(result.data.products as Product[]);
        setOriginVariants(result.data.variants as ProductVariant[]);
        setOriginInventoryItems(result.data.inventoryItems as InventoryItem[]);
        setOriginStockLots(result.data.stockLots as StockLot[]);
      } finally {
        if (!cancelled) {
          setIsLoadingOriginInventory(false);
        }
      }
    }

    loadOriginInventory();
    return () => {
      cancelled = true;
    };
  }, [formData.fromBranchId]);

  const effectiveProducts = formData.fromBranchId ? originProducts : products;
  const effectiveVariants = formData.fromBranchId
    ? originVariants
    : productVariants;
  const effectiveInventoryItems = formData.fromBranchId
    ? originInventoryItems
    : inventoryItems;
  const effectiveStockLots = formData.fromBranchId
    ? originStockLots
    : stockLots;

  // Filtrar stock disponible según sucursal origen
  const availableStock = useMemo<AvailableStockItem[]>(() => {
    if (!formData.fromBranchId) return [];

    // Map serial items
    const serials = effectiveInventoryItems
      .filter(
        (item) =>
          item.branchId === formData.fromBranchId &&
          item.status === "disponible",
      )
      .map((item) => {
        const product = effectiveProducts.find((p) => p.id === item.productId);
        const variant = effectiveVariants.find((v) => v.id === item.variantId);
        const size = variant?.attributes?.size
          ? getSizeById(variant.attributes.size)?.name
          : "";
        const color = variant?.attributes?.color
          ? getColorById(variant.attributes.color)?.name
          : "";

        return {
          id: item.id,
          productId: item.productId,
          productName: product?.name || "Producto",
          variantId: item.variantId,
          variantName: `${size} / ${color}`.trim() || variant?.variantCode,
          variantCode: variant?.variantCode || "",
          barcode: variant?.barcode || "",
          isSerial: true,
          serialCode: item.serialCode,
          quantity: 1,
          branchId: item.branchId,
          condition: "Excelente", // Default
        };
      });

    // Map lot items
    const lots = effectiveStockLots
      .filter(
        (lot) =>
          lot.branchId === formData.fromBranchId &&
          lot.status === "disponible" &&
          lot.quantity > 0,
      )
      .map((lot) => {
        const product = effectiveProducts.find((p) => p.id === lot.productId);
        const variant = effectiveVariants.find((v) => v.id === lot.variantId);
        const size = variant?.attributes?.size
          ? getSizeById(variant.attributes.size)?.name
          : "";
        const color = variant?.attributes?.color
          ? getColorById(variant.attributes.color)?.name
          : "";

        return {
          id: lot.id,
          productId: lot.productId,
          productName: product?.name || "Producto",
          variantId: lot.variantId,
          variantName: `${size} / ${color}`.trim() || variant?.variantCode,
          variantCode: variant?.variantCode || "",
          barcode: variant?.barcode || "",
          isSerial: false,
          quantity: lot.quantity,
          branchId: lot.branchId,
          condition: "Nuevo",
        };
      });

    return [...serials, ...lots];
  }, [
    formData.fromBranchId,
    effectiveInventoryItems,
    effectiveStockLots,
    effectiveProducts,
    effectiveVariants,
    getSizeById,
    getColorById,
  ]);

  const branchesToUse = branches;

  // Agrupar stock por variante para no serializados
  const groupedStock = useMemo(() => {
    const groups: Record<string, AvailableStockItem[]> = {};
    availableStock.forEach((item) => {
      const key = item.variantId;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [availableStock]);

  const selectedFromBranch = branchesToUse.find(
    (b) => b.id === formData.fromBranchId,
  );
  const selectedToBranch = branchesToUse.find(
    (b) => b.id === formData.toBranchId,
  );
  const tenantConfig = config || (DEFAULT_CONFIG as any);
  const estimatedTransferTime =
    formData.fromBranchId && formData.toBranchId
      ? getEstimatedTransferTime(
          formData.fromBranchId,
          formData.toBranchId,
          tenantConfig,
        )
      : null;

  const handleAddItem = (stockItem: AvailableStockItem) => {
    // Verificar si ya está agregado
    const existingIndex = formData.items?.findIndex((item) =>
      item.isSerial
        ? item.itemId === stockItem.id
        : item.stockId === stockItem.id,
    );

    if (existingIndex !== -1) {
      setScanMessage({
        type: "error",
        text: "Este item ya está en la transferencia",
      });
      return;
    }

    const newItem: TransferItem = {
      id: crypto.randomUUID(),
      stockId: stockItem.isSerial ? undefined : stockItem.id,
      itemId: stockItem.isSerial ? stockItem.id : undefined,
      productId: stockItem.productId,
      productName: stockItem.productName,
      variantId: stockItem.variantId,
      variantName: stockItem.variantName,
      variantCode: stockItem.variantCode,
      isSerial: stockItem.isSerial,
      serialCode: stockItem.serialCode,
      quantity: stockItem.isSerial ? 1 : 1, // Para no serializados, default 1
      barcode: stockItem.barcode,
      condition: stockItem.condition,
      fromBranchId: stockItem.branchId,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
    setScanMessage({
      type: "success",
      text: `Agregado: ${stockItem.productName} ${stockItem.isSerial ? `(Serial: ${stockItem.serialCode})` : ""}`,
    });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    const item = formData.items?.find((i) => i.id === itemId);
    if (!item || item.isSerial) return; // No permitir cambiar cantidad de serializados

    // Buscar stock disponible
    const stockItem = availableStock.find((s) => s.id === item.stockId);
    const maxQuantity = stockItem?.quantity || 0;

    if (quantity > maxQuantity) {
      setScanMessage({
        type: "error",
        text: `Stock insuficiente. Máximo: ${maxQuantity}`,
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items:
        prev.items?.map((i) => (i.id === itemId ? { ...i, quantity } : i)) ||
        [],
    }));
  };

  const getAvailableLotQuantity = (stockId?: string) => {
    if (!stockId) return 0;
    return availableStock.find((stock) => stock.id === stockId)?.quantity || 0;
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items?.filter((i) => i.id !== itemId) || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.fromBranchId ||
      !formData.toBranchId ||
      !formData.items?.length
    )
      return;

    const data: TransferFormData = {
      fromBranchId: formData.fromBranchId,
      toBranchId: formData.toBranchId,
      referenceNumber: formData.referenceNumber || "",
      notes: formData.notes || "",
      scheduledDate:
        formData.scheduledDate || new Date().toISOString().split("T")[0],
      items: formData.items,
      priority: formData.priority || "normal",
      requiresApproval: formData.requiresApproval || false,
    };

    onSubmit(data);
  };

  const totalItems =
    formData.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const serialCount = formData.items?.filter((i) => i.isSerial).length || 0;
  const nonSerialCount = formData.items?.filter((i) => !i.isSerial).length || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header con info general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Nueva Transferencia de Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  N° Referencia
                </Label>
                <Input
                  value={formData.referenceNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      referenceNumber: e.target.value,
                    })
                  }
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha Programada
                </Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <Label>Notas / Instrucciones</Label>
              <Input
                placeholder="Instrucciones especiales para la transferencia..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="pt-1 text-sm">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Items:</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Serializados:</span>
              <Badge variant="secondary">{serialCount}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">No Serializados:</span>
              <Badge variant="outline">{nonSerialCount}</Badge>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-medium">
              <span>Productos únicos:</span>
              <span>{formData.items?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selección de Sucursales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={cn(
            "border-l",
            selectedFromBranch ? "border-l-blue-500" : "border-l-muted",
          )}
        >
          <CardHeader>
            <CardTitle className="text-base mt-1 flex items-center gap-2 text-blue-400">
              <Store className="w-4 h-4" />
              Origen *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={formData.fromBranchId}
              onValueChange={(val) => {
                setFormData({
                  ...formData,
                  fromBranchId: val,
                  items: [], // Limpiar items al cambiar origen
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal origen..." />
              </SelectTrigger>
              <SelectContent portal={false}>
                {branchesToUse.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedFromBranch && (
              <div className="p-3 mb-3 bg-blue-500/10 rounded-lg text-sm space-y-1">
                <p className="font-medium text-blue-300">
                  {selectedFromBranch.name}
                </p>
                <p className="text-blue-700">{selectedFromBranch.address}</p>
                <p className="text-blue-600 text-xs">
                  {isLoadingOriginInventory
                    ? "Cargando inventario..."
                    : `${availableStock.length} items disponibles para transferir`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={cn(
            "border-l",
            selectedToBranch ? "border-l-green-500" : "border-l-muted",
          )}
        >
          <CardHeader>
            <CardTitle className="text-base pt-1 flex items-center gap-2 text-green-400">
              <Truck className="w-4 h-4" />
              Destino *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={formData.toBranchId}
              onValueChange={(val) =>
                setFormData({ ...formData, toBranchId: val })
              }
              disabled={!formData.fromBranchId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal destino..." />
              </SelectTrigger>
              <SelectContent portal={false}>
                {branchesToUse
                  .filter((b) => b.id !== formData.fromBranchId)
                  .map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selectedToBranch && (
              <div className="p-3 bg-green-500/10 rounded-lg text-sm space-y-1">
                <p className="font-medium text-green-300">
                  {selectedToBranch.name}
                </p>
                <p className="text-green-700">{selectedToBranch.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {estimatedTransferTime !== null && (
        <div className="border-l p-2 rounded-lg border bg-card border-l-amber-500 flex items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-sm font-medium">Tiempo estimado de traslado</p>
            <p className="text-sm text-muted-foreground">
              Esta transferencia usara las horas configuradas para la ruta o el
              tiempo global por defecto.
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {estimatedTransferTime}{" "}
            {estimatedTransferTime === 1 ? "hora" : "horas"}
          </Badge>
        </div>
      )}

      {/* Agregar Items */}
      {formData.fromBranchId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base mt-1 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Agregar Items a Transferir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Escáner y búsqueda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full gap-2 h-auto py-4"
                  >
                    <ScanLine className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Escanear Código</p>
                      <p className="text-xs text-muted-foreground">
                        Barcode o Serial QR
                      </p>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" portal={false}>
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ScanLine className="w-4 h-4" />
                      Escanear Item
                    </h4>
                    <StockScanner
                      availableStock={availableStock}
                      onScan={handleAddItem}
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full gap-2 h-auto py-4"
                  >
                    <Search className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Buscar Manual</p>
                      <p className="text-xs text-muted-foreground">
                        Seleccionar de lista
                      </p>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" portal={false}>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Stock Disponible</h4>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {availableStock.map((stock) => (
                          <div
                            key={stock.id}
                            className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleAddItem(stock)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">
                                  {stock.productName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {stock.variantName}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant={
                                      stock.isSerial ? "default" : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {stock.isSerial ? "Serial" : "Lote"}
                                  </Badge>
                                  <span className="text-xs font-mono text-muted-foreground">
                                    {stock.isSerial
                                      ? stock.serialCode
                                      : `Stock: ${stock.quantity}`}
                                  </span>
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Mensaje de feedback */}
            {scanMessage && (
              <div
                className={cn(
                  "flex items-center gap-2 text-sm p-3 rounded-md",
                  scanMessage.type === "success"
                    ? "bg-green-500/30 text-green-400 border border-green-500"
                    : "bg-red-500/30 text-red-400 border border-red-500",
                )}
              >
                {scanMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {scanMessage.text}
              </div>
            )}

            {/* Lista de items agregados */}
            {formData.items && formData.items.length > 0 && (
              <div className="space-y-2 mb-3">
                <Label className="text-sm text-muted-foreground">
                  {formData.items.length} items en transferencia:
                </Label>
                <div className="space-y-2">
                  {formData.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {item.productName}
                          </p>
                          <Badge
                            variant={item.isSerial ? "default" : "secondary"}
                            className="text-xs shrink-0"
                          >
                            {item.isSerial ? (
                              <QrCode className="w-3 h-3 mr-1" />
                            ) : (
                              <Barcode className="w-3 h-3 mr-1" />
                            )}
                            {item.isSerial ? "Serial" : "Lote"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.variantName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <code className="font-mono bg-background px-1 rounded">
                            {item.isSerial ? item.serialCode : item.variantCode}
                          </code>
                          <span className="text-muted-foreground">•</span>
                          <span
                            className={cn(
                              "px-1 rounded",
                              item.condition === "Nuevo"
                                ? "bg-green-100 text-green-700"
                                : item.condition === "Usado"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-purple-100 text-purple-700",
                            )}
                          >
                            {item.condition}
                          </span>
                        </div>
                      </div>

                      {!item.isSerial && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={getAvailableLotQuantity(item.stockId) || 1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                item.id,
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-20 h-8 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.id,
                                Math.min(
                                  getAvailableLotQuantity(item.stockId) || 1,
                                  item.quantity + 1,
                                ),
                              )
                            }
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            de {getAvailableLotQuantity(item.stockId) || 1}
                          </span>
                        </div>
                      )}

                      {item.isSerial && (
                        <div className="text-xs font-mono text-muted-foreground">
                          1 unidad
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!formData.items || formData.items.length === 0) && (
              <div className="text-center mb-3 py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay items agregados</p>
                <p className="text-xs">Escanea o busca items para agregarlos</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prioridad y opciones */}

      <div className="border w-full rounded-lg bg-card p-2">
        <div className="grid grid-cols-1 items-center justify-center md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select
              value={formData.priority}
              onValueChange={(val: "baja" | "normal" | "alta" | "urgente") =>
                setFormData({ ...formData, priority: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar prioridad" />
              </SelectTrigger>
                <SelectContent portal={false}>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiresApproval: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm">Requiere aprobación</span>
            </label>
          </div>
        </div>
      </div>

      {/* Botón Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button
          type="submit"
          className="gap-2"
          disabled={
            !formData.fromBranchId ||
            !formData.toBranchId ||
            !formData.items?.length
          }
        >
          <ArrowRightLeft className="w-4 h-4" />
          Crear Transferencia ({totalItems} items)
        </Button>
      </div>
    </form>
  );
}
