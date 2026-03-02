// components/inventory/StockForm.tsx
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { useInventoryStore } from "@/src/store/useInventoryStore";

const STATUS_OPTIONS = [
  { value: "disponible", label: "Disponible", color: "green" },
  { value: "bajo_pedido", label: "Bajo Pedido", color: "orange" },
  { value: "discontinuado", label: "Discontinuado", color: "red" },
];

interface StockFormProps {
  onSubmit: (data: StockFormData) => void;
}

const hashCode = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

// Componente de escaneo
function BarcodeScanner({ onScan }: { onScan: (code: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      const randomCode = Math.floor(Math.random() * 1000000000000)
        .toString()
        .padStart(13, "0");
      onScan(randomCode);
      setScanning(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors",
          scanning
            ? "border-green-500 bg-green-50 animate-pulse"
            : "border-muted hover:border-primary",
        )}
        onClick={!scanning ? simulateScan : undefined}
      >
        {scanning ? (
          <div className="text-center">
            <ScanLine className="w-10 h-10 text-green-500 mx-auto mb-2 animate-bounce" />
            <p className="text-sm text-green-600 font-medium">Escaneando...</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <ScanLine className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Haz clic para simular escaneo</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">O ingresa manualmente:</p>
        <div className="flex gap-2">
          <Input
            placeholder="1234567890123"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            maxLength={13}
            className="font-mono text-sm"
          />
          <Button
            size="sm"
            onClick={() => manualCode && onScan(manualCode)}
            disabled={manualCode.length < 8}
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StockForm({ onSubmit }: StockFormProps) {
  const products = useInventoryStore((state) => state.products);
  const productVariants = useInventoryStore((state) => state.productVariants);

  const [formData, setFormData] = useState<Partial<StockFormData>>({
    quantity: 0,
    isForRent: true,
    isForSale: true,
    status: "disponible",
  });
  const [scanMessage, setScanMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const productsWithVariants = useMemo(() => {
    const createVariantName = (variant: ProductVariant): string => {
      const values = Object.values(variant.attributes || {});
      return values.length > 0 ? values.join(" / ") : variant.variantCode;
    };

    return products
      .filter((product) => !product.is_serial && !product.isDeleted)
      .map((product) => ({
      ...product,
      variants: productVariants.filter(
        (variant) => variant.productId === product.id && variant.isActive,
      ).map((variant) => ({
        id: variant.id,
        name: createVariantName(variant),
        variantCode: variant.variantCode,
        barcode:
          variant.barcode ??
          String(Math.abs(hashCode(variant.variantCode))).slice(0, 13).padStart(13, "0"),
      })),
    }));
  }, [productVariants, products]);

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
  const selectedBranch = availableBranches.find((b) => b.id === formData.branchId);

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
      isForRent: formData.isForRent ?? true,
      isForSale: formData.isForSale ?? true,
      status: formData.status || "disponible",
    };

    onSubmit(data);

    setFormData({
      quantity: 0,
      isForRent: true,
      isForSale: true,
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            Nuevo Lote de Stock
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PRODUCTO */}
          <div className="space-y-2">
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
              <SelectTrigger>
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
          <div className="space-y-3">
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
                    className={cn(
                      selectedVariant && "border-primary bg-primary/5",
                    )}
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
                          <div className="flex flex-col">
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
                    Escanear
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
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200",
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

          {/* SUCURSAL */}
          <div className="space-y-2">
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
              <SelectTrigger>
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

          {/* CANTIDAD */}
          <div className="space-y-2">
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

          {/* DATOS OPCIONALES DEL LOTE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Número de Lote
              </Label>
              <Input
                value={formData.lotNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lotNumber: e.target.value })
                }
                placeholder="Ej: LOTE-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha de Expiración
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
          </div>

          {/* USOS DEL STOCK */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Disponible para:
            </Label>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isForRent}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isForRent: checked })
                  }
                />
                <Label className="cursor-pointer">Renta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isForSale}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isForSale: checked })
                  }
                />
                <Label className="cursor-pointer">Venta</Label>
              </div>
            </div>
          </div>

          {/* ESTADO */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(val: any) =>
                setFormData({ ...formData, status: val })
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
        </CardContent>
      </Card>
    </form>
  );
}
