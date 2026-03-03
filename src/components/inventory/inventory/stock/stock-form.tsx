// components/inventory/StockForm.tsx
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Plus,
  Package,
  Barcode,
  Store,
  Calendar,
  Tag,
  DollarSign,
  ScanLine,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StockFormData } from "@/src/application/interfaces/stock/StockFormData";
import { BRANCH_MOCKS } from "@/src/mocks/mock.branch";
import { useInventoryProductOptions } from "@/src/hooks/inventory/useInventoryProductOptions";
import { Badge } from "@/components/badge";
import { BarcodeScanner } from "../barcode/BarcodeScanner";
import { useIsMobile } from "@/src/hooks/use-mobile";

const STATUS_OPTIONS = [
  { value: "disponible", label: "Disponible", color: "green" },
  { value: "bajo_pedido", label: "Bajo Pedido", color: "orange" },
  { value: "discontinuado", label: "Discontinuado", color: "red" },
];

interface StockFormProps {
  onSubmit: (data: StockFormData) => void;
}

export function StockForm({ onSubmit }: StockFormProps) {
  const productsWithVariants = useInventoryProductOptions(false);

  const [formData, setFormData] = useState<Partial<StockFormData>>({
    quantity: 0,
    status: "disponible",
  });
  const [scanMessage, setScanMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedProduct = productsWithVariants.find(
    (p) => p.id === formData.productId,
  );
  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.id === formData.variantId,
  );
  const availableBranches = useMemo(
    () => BRANCH_MOCKS.filter((branch) => branch.status === "active"),
    [],
  );
  const selectedBranch = availableBranches.find(
    (b) => b.id === formData.branchId,
  );

  const isMobile = useIsMobile();

  const handleScan = (barcode: string) => {
    setScanMessage(null);

    for (const product of productsWithVariants) {
      const variant = product.variants.find((v) => v.barcode === barcode);
      if (variant) {
        setFormData((prev) => ({
          ...prev,
          productId: product.id,
          variantId: variant.id,
          barcode: variant.barcode,
        }));
        setScanMessage({
          type: "success",
          text: `Encontrado: ${product.name} - ${variant.name}`,
        });
        return;
      }
    }

    setScanMessage({
      type: "error",
      text: "Código no encontrado en variantes registradas",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedVariant || !formData.branchId) return;

    const data: StockFormData = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      variantCode: selectedVariant.variantCode,
      variantBarcode: selectedVariant.barcode,
      branchId: formData.branchId,
      branchName: selectedBranch?.name || "",
      quantity: formData.quantity || 0,
      barcode: formData.barcode || selectedVariant.barcode,
      expirationDate: formData.expirationDate,
      lotNumber: formData.lotNumber,
      isForRent: selectedProduct.can_rent,
      isForSale: selectedProduct.can_sell,
      status: formData.status || "disponible",
    };

    onSubmit(data);

    setFormData({
      quantity: 0,
      status: "disponible",
      productId: undefined,
      variantId: undefined,
      barcode: undefined,
      lotNumber: undefined,
      expirationDate: undefined,
    });
    setScanMessage(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="text-lg flex items-center gap-2">
          <Package className="w-5 h-5" />
          Nuevo Lote de Stock
        </div>

        {/* PRODUCTO */}
        <div className=" flex gap-4 md:flex-row flex-col space-y-2">
          <div className="w-full space-y-1">
            <Label>Producto *</Label>
            <Select
              value={formData.productId}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  productId: val,
                  variantId: undefined,
                  barcode: undefined,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar producto..." />
              </SelectTrigger>
              <SelectContent>
                {productsWithVariants.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VARIANTE CON ESCANER */}

          <div className="w-full space-y-1">
            <Label className="flex items-center gap-2">
              <Barcode className="w-4 h-4" />
              Variante *
            </Label>

            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <Select
                  value={formData.variantId}
                  onValueChange={(val) => {
                    const variant = selectedProduct?.variants.find(
                      (v) => v.id === val,
                    );
                    if (variant) {
                      setFormData({
                        ...formData,
                        variantId: val,
                        barcode: variant.barcode,
                      });
                      setScanMessage(null);
                    }
                  }}
                  disabled={!selectedProduct}
                >
                  <SelectTrigger
                    className={cn(selectedVariant && "bg-primary/5", "w-full")}
                  >
                    <SelectValue
                      placeholder={
                        selectedProduct
                          ? "Seleccionar variante..."
                          : "Primero selecciona un producto"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProduct ? (
                      selectedProduct.variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{variant.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {variant.variantCode} • Barcode: {variant.barcode}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="disabled" disabled>
                        Selecciona un producto primero
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 shrink-0"
                  >
                    <ScanLine className="w-4 h-4" />
                    {isMobile ? "" : "Escanear"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ScanLine className="w-4 h-4" />
                      Escanear Código de Barras
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Escanea el código de la variante para autocompletar
                    </p>
                    <BarcodeScanner onScan={handleScan} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {scanMessage && (
              <div
                className={cn(
                  "flex items-center gap-2 text-sm p-2 rounded-md",
                  scanMessage.type === "success"
                    ? "bg-green-50/10 text-green-700 border"
                    : "bg-red-50/10 text-red-700 border",
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
          </div>

          {/* CANTIDAD */}
          <div className="w-full space-y-1">
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Cantidad *
            </Label>
            <Input
              type="number"
              min={0}
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
            />
          </div>
        </div>

        {/* DATOS OPCIONALES DEL LOTE */}
        <div className="flex w-full md:flex-row flex-col gap-4">
          <div className="space-y-2 w-full">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Número de Lote (Opcional)
            </Label>
            <Input
              value={formData.lotNumber || ""}
              onChange={(e) =>
                setFormData({ ...formData, lotNumber: e.target.value })
              }
              placeholder="Ej: LOTE-2024-001"
            />
          </div>

          <div className="space-y-2 w-full">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha de Expiración{" "}
              <span className="text-xs text-muted-foreground">
                (Solo para productos con fecha de vencimiento)
              </span>
            </Label>
            <Input
              type="date"
              value={
                formData.expirationDate
                  ? formData.expirationDate.toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expirationDate: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                })
              }
            />
          </div>

          {/* SUCURSAL */}
          <div className="space-y-2 w-full">
            <Label className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Sucursal *
            </Label>
            <Select
              value={formData.branchId}
              onValueChange={(val) =>
                setFormData({ ...formData, branchId: val })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar sucursal..." />
              </SelectTrigger>
              <SelectContent>
                {availableBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex w-full md:flex-row flex-col items-center gap-4">
          {/* USOS DEL PRODUCTO PADRE */}
          <div className="flex rounded-md border h-10 px-3 w-full mt-4 bg-muted/30">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Política comercial del producto:
            </Label>
            <div className="flex items-center ml-4">
              {selectedProduct ? (
                <>
                  {selectedProduct.can_rent && (
                    <Badge variant="secondary">Renta</Badge>
                  )}
                  {selectedProduct.can_sell && (
                    <Badge variant="secondary">Venta</Badge>
                  )}
                  {!selectedProduct.can_rent && !selectedProduct.can_sell && (
                    <Badge variant="destructive">Sin uso comercial</Badge>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Selecciona un producto para ver su política de uso.
                </span>
              )}
            </div>
          </div>

          {/* ESTADO */}
          <div className="space-y-2 w-full">
            <Label>Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  status: val as StockFormData["status"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn("w-2 h-2 rounded-full", {
                          "bg-green-500": opt.color === "green",
                          "bg-orange-500": opt.color === "orange",
                          "bg-red-500": opt.color === "red",
                        })}
                      />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            {/* BOTÓN SUBMIT */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                !selectedProduct || !selectedVariant || !formData.branchId
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Lote de Stock
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
