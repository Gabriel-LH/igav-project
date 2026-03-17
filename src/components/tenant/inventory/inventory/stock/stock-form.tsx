// components/inventory/StockForm.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  Settings,
  Blocks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StockFormData } from "@/src/application/interfaces/stock/StockFormData";
import { useInventoryProductOptions } from "@/src/hooks/inventory/useInventoryProductOptions";
import { BarcodeScanner } from "../barcode/Scanner";
import { Branch } from "@/src/types/branch/type.branch";
import {
  CONDITION_OPTIONS,
  STATUS_OPTIONS,
} from "@/src/utils/serialize/options";

interface StockFormProps {
  onSubmit: (data: StockFormData) => void;
  initialBranches: Branch[];
  initialProductId?: string;
  initialVariantId?: string;
  initialBranchId?: string;
}

export function StockForm({
  onSubmit,
  initialBranches,
  initialProductId,
  initialVariantId,
  initialBranchId,
}: StockFormProps) {
  const productsWithVariants = useInventoryProductOptions(false);

  const [formData, setFormData] = useState<
    Partial<StockFormData & { rentQuantity?: number; sellQuantity?: number }>
  >({
    productId: initialProductId || "",
    variantId: initialVariantId || "",
    branchId: initialBranchId || "",
    quantity: 0,
    rentQuantity: 0,
    sellQuantity: 0,
    status: "en_transito",
    condition: "Nuevo",
    isForRent: false,
    isForSale: false,
  });
  const [scanMessage, setScanMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (initialBranchId && !formData.branchId) {
      setFormData((prev) => ({ ...prev, branchId: initialBranchId }));
    }
  }, [initialBranchId, formData.branchId]);

  const selectedProduct = productsWithVariants.find(
    (p) => p.id === formData.productId,
  );
  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.id === formData.variantId,
  );
  const availableBranches = useMemo(
    () => initialBranches.filter((branch) => branch.status === "active"),
    [initialBranches],
  );
  const selectedBranch = availableBranches.find(
    (b) => b.id === formData.branchId,
  );

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

    if (formData.isForRent && (formData.rentQuantity || 0) > 0) {
      onSubmit({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        variantCode: selectedVariant.variantCode,
        variantBarcode: selectedVariant.barcode,
        branchId: formData.branchId,
        branchName: selectedBranch?.name || "",
        quantity: formData.rentQuantity || 0,
        barcode: formData.barcode || selectedVariant.barcode,
        expirationDate: formData.expirationDate,
        lotNumber: formData.lotNumber,
        isForRent: true,
        isForSale: false,
        status: formData.status || "disponible",
        condition: formData.condition || "Nuevo",
      });
    }

    if (formData.isForSale && (formData.sellQuantity || 0) > 0) {
      onSubmit({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        variantCode: selectedVariant.variantCode,
        variantBarcode: selectedVariant.barcode,
        branchId: formData.branchId,
        branchName: selectedBranch?.name || "",
        quantity: formData.sellQuantity || 0,
        barcode: formData.barcode || selectedVariant.barcode,
        expirationDate: formData.expirationDate,
        lotNumber: formData.lotNumber,
        isForRent: false,
        isForSale: true,
        status: formData.status || "disponible",
        condition: formData.condition || "Nuevo",
      });
    }

    setFormData({
      quantity: 0,
      rentQuantity: 0,
      sellQuantity: 0,
      status: "disponible",
      productId: undefined,
      variantId: undefined,
      barcode: undefined,
      lotNumber: undefined,
      expirationDate: undefined,
      isForRent: false,
      isForSale: false,
    });
    setScanMessage(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="text-2xl flex items-center gap-2 font-semibold">
          <Package className="w-6 h-6 text-primary" />
          Nuevo Lote de Stock
        </div>

        <div className="flex flex-col gap-4 border rounded-lg shadow-lg/20 dark:shadow-slate-500/50">
          {/* SECCIÓN 1: PRODUCTO Y VARIANTE */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 w-full justify-between ">
            <div className="space-y-1">
              <Label>Producto *</Label>
              <Select
                value={formData.productId}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    productId: val,
                    variantId: undefined,
                    barcode: undefined,
                    isForRent: false,
                    isForSale: false,
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

            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Barcode className="w-4 h-4" />
                Variante *
              </Label>
              <div className="flex gap-2">
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
                          : "Selecciona un producto"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProduct?.variants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        <div className="flex flex-col items-start leading-tight">
                          <span>{variant.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {variant.variantCode}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                    >
                      <ScanLine className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <ScanLine className="w-4 h-4" />
                        Escanear Código
                      </h4>
                      <BarcodeScanner onScan={handleScan} />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Store className="w-4 h-4" /> Sucursal *
              </Label>
              <Select
                value={formData.branchId}
                onValueChange={(val) =>
                  setFormData({ ...formData, branchId: val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
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

            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" /> Número de Lote
              </Label>
              <Input
                value={formData.lotNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lotNumber: e.target.value })
                }
                placeholder="Ej: LOTE-2024-001"
              />
            </div>

            {scanMessage && (
              <div
                className={cn(
                  "col-span-full flex items-center gap-2 text-sm p-2 rounded",
                  scanMessage.type === "success"
                    ? " text-green-700"
                    : " text-red-700",
                )}
              >
                {scanMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {scanMessage.text}
              </div>
            )}
          </div>

          {/* SECCIÓN 2: DATOS DEL LOTE */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 ">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Expira
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

            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Settings className="w-4 h-4" /> Condición
              </Label>
              <Select
                value={formData.condition}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    condition: val as StockFormData["condition"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn("w-2 h-2 rounded-full", {
                            "bg-green-500": opt.color === "green",
                            "bg-orange-500": opt.color === "orange",
                            "bg-purple-500": opt.color === "purple",
                          })}
                        />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
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
                            "bg-blue-500": opt.color === "blue",
                            "bg-green-500": opt.color === "green",
                          })}
                        />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {/* SECCIÓN 3: POLÍTICA Y CANTIDADES */}
        <div className="space-y-4 p-4 border rounded-lg shadow-lg/20 dark:shadow-slate-500/50">
          <Label className="text-base flex items-center gap-2 font-semibold">
            <Blocks className="w-5 h-5 text-primary" />
            Configuración de Inventario por Uso
          </Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RENTA */}
            {(selectedProduct?.can_rent || !selectedProduct) && (
              <div
                className={cn(
                  "space-y-3 p-4 border rounded-md transition-opacity",
                  !selectedProduct?.can_rent &&
                    selectedProduct &&
                    "opacity-40 grayscale pointer-events-none",
                )}
              >
                <div className="flex items-center justify-between">
                  <Label
                    className="font-semibold cursor-pointer"
                    htmlFor="isForRent"
                  >
                    Cantidad Para Alquiler
                  </Label>
                  <Switch
                    id="isForRent"
                    disabled={!selectedProduct?.can_rent}
                    checked={formData.isForRent}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isForRent: checked })
                    }
                  />
                </div>
                <Input
                  type="number"
                  min={0}
                  disabled={!formData.isForRent}
                  value={formData.rentQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rentQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Cantidad..."
                />
              </div>
            )}

            {/* VENTA */}
            {(selectedProduct?.can_sell || !selectedProduct) && (
              <div
                className={cn(
                  "space-y-3 p-4 border rounded-md transition-opacity",
                  !selectedProduct?.can_sell &&
                    selectedProduct &&
                    "opacity-40 grayscale pointer-events-none",
                )}
              >
                <div className="flex items-center justify-between">
                  <Label
                    className="font-semibold cursor-pointer"
                    htmlFor="isForSale"
                  >
                    Cantidad Para Venta
                  </Label>
                  <Switch
                    id="isForSale"
                    disabled={!selectedProduct?.can_sell}
                    checked={formData.isForSale}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isForSale: checked })
                    }
                  />
                </div>
                <Input
                  type="number"
                  min={0}
                  disabled={!formData.isForSale}
                  value={formData.sellQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sellQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Cantidad..."
                />
              </div>
            )}
          </div>

          {!selectedProduct && (
            <p className="text-center text-xs text-muted-foreground pb-2 italic">
              * Selecciona un producto para configurar cantidades.
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full font-bold"
          disabled={
            !selectedProduct ||
            !selectedVariant ||
            !formData.branchId ||
            (!formData.isForRent && !formData.isForSale) ||
            (formData.isForRent &&
              (formData.rentQuantity || 0) <= 0 &&
              !formData.isForSale) ||
            (formData.isForSale &&
              (formData.sellQuantity || 0) <= 0 &&
              !formData.isForRent) ||
            (formData.isForRent &&
              formData.isForSale &&
              (formData.rentQuantity || 0) <= 0 &&
              (formData.sellQuantity || 0) <= 0)
          }
        >
          <Plus className="w-5 h-5 mr-2" />
          Registrar Lotes de Stock
        </Button>
      </div>
    </form>
  );
}
