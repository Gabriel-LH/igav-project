// components/inventory/SerializedItemForm.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Package,
  QrCode,
  Store,
  Settings,
  DollarSign,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Hash,
  RefreshCw,
  Calendar,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarcodeScanner } from "../barcode/BarcodeScanner";
import { MOCK_BRANCHES } from "@/src/mocks/mock.branch";
import { SerializedItemFormData } from "@/src/application/interfaces/inventory/SerializedItemFormData";
import { useInventoryProductOptions } from "@/src/hooks/inventory/useInventoryProductOptions";
import { Badge } from "@/components/badge";

const CONDITION_OPTIONS = [
  { value: "Nuevo", label: "Nuevo", color: "green" },
  { value: "Usado", label: "Usado", color: "orange" },
  { value: "Vintage", label: "Vintage", color: "purple" },
];

const STATUS_OPTIONS = [
  { value: "disponible", label: "Disponible", color: "green" },
  { value: "en_mantenimiento", label: "En Mantenimiento", color: "orange" },
  { value: "retirado", label: "Retirado", color: "red" },
];

interface SerializedItemFormProps {
  onSubmit: (data: SerializedItemFormData) => void;
}

// Generador de códigos seriales únicos
function generateSerialCodes(
  prefix: string,
  variantCode: string,
  quantity: number,
  existingCodes: string[] = [],
): string[] {
  const codes: string[] = [];
  const usedCodes = new Set(existingCodes);

  // Limpiar prefijo
  const cleanPrefix = prefix.trim().toUpperCase();
  const cleanVariant = variantCode.replace(/-/g, "").substring(0, 8);

  let attempts = 0;
  const maxAttempts = quantity * 100; // Prevenir loop infinito

  while (codes.length < quantity && attempts < maxAttempts) {
    attempts++;

    // Formato: PREFIX-VARIANT-TIMESTAMP-RANDOM
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const sequential = String(codes.length + 1).padStart(3, "0");

    const serialCode = `${cleanPrefix}-${cleanVariant}-${timestamp}${random}-${sequential}`;

    if (!usedCodes.has(serialCode)) {
      codes.push(serialCode);
      usedCodes.add(serialCode);
    }
  }

  return codes;
}

// Componente de escaneo


export function SerializedItemForm({ onSubmit }: SerializedItemFormProps) {
  const availableProducts = useInventoryProductOptions(true);

  const [formData, setFormData] = useState<Partial<SerializedItemFormData>>({
    quantity: 1,
    condition: "Nuevo",
    status: "disponible",
    autoGenerateSerials: true,
    prefix: "ITEM",
    serialCodes: [],
    damageNotes: "",
  });
  const [scanMessage, setScanMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  const selectedProduct = availableProducts.find(
    (p) => p.id === formData.productId,
  );
  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.id === formData.variantId,
  );
  const availableBranches = useMemo(
    () => MOCK_BRANCHES.filter((branch) => branch.status === "active"),
    [],
  );
  const selectedBranch = availableBranches.find((b) => b.id === formData.branchId);

  const selectedSerialCodes = formData.autoGenerateSerials
    ? generatedCodes
    : formData.serialCodes || [];

  const refreshGeneratedCodes = (
    quantity = formData.quantity,
    prefix = formData.prefix,
    variantCode = selectedVariant?.variantCode,
    autoGenerate = formData.autoGenerateSerials,
  ) => {
    if (!autoGenerate || !quantity || !prefix || !variantCode) {
      setGeneratedCodes([]);
      return;
    }

    const codes = generateSerialCodes(prefix, variantCode, quantity, []);
    setGeneratedCodes(codes);
  };

  const handleScan = (barcode: string) => {
    setScanMessage(null);

    for (const product of availableProducts) {
      const variant = product.variants.find((v) => v.barcode === barcode);
      if (variant) {
        setFormData((prev) => ({
          ...prev,
          productId: product.id,
          variantId: variant.id,
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

  const handleManualSerialChange = (index: number, value: string) => {
    const newCodes = [...(formData.serialCodes || [])];
    newCodes[index] = value.toUpperCase();
    setFormData((prev) => ({ ...prev, serialCodes: newCodes }));
  };

  const regenerateCodes = () => {
    if (!formData.autoGenerateSerials) return;
    refreshGeneratedCodes();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedProduct ||
      !selectedVariant ||
      !formData.branchId ||
      !selectedSerialCodes.length
    )
      return;

    const data: SerializedItemFormData = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      variantCode: selectedVariant.variantCode,
      variantBarcode: selectedVariant.barcode,
      branchId: formData.branchId,
      branchName: selectedBranch?.name || "",
      quantity: formData.quantity || 1,
      serialCodes: selectedSerialCodes,
      isForRent: selectedProduct.can_rent,
      isForSale: selectedProduct.can_sell,
      condition: formData.condition || "Nuevo",
      status: formData.status || "disponible",
      lastMaintenance: formData.lastMaintenance,
      damageNotes: formData.damageNotes,
      autoGenerateSerials: formData.autoGenerateSerials ?? true,
      prefix: formData.prefix,
    };

    onSubmit(data);

    // Reset
    setFormData({
      quantity: 1,
      condition: "Nuevo",
      status: "disponible",
      autoGenerateSerials: true,
      prefix: "ITEM",
      serialCodes: [],
      damageNotes: "",
      productId: undefined,
      variantId: undefined,
    });
    setGeneratedCodes([]);
    setScanMessage(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Nuevo Item Serializado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PRODUCTO */}
          <div className="space-y-2">
            <Label>Producto *</Label>
            <Select
              value={formData.productId}
              onValueChange={(val) => {
                setFormData({
                  ...formData,
                  productId: val,
                  variantId: undefined,
                  serialCodes: [],
                });
                setGeneratedCodes([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto..." />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((product) => (
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
              <Package className="w-4 h-4" />
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
                        serialCodes: [],
                      });
                      if (formData.autoGenerateSerials) {
                        refreshGeneratedCodes(
                          formData.quantity,
                          formData.prefix,
                          variant.variantCode,
                        );
                      }
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
                      Escanear Variante
                    </h4>
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

          {/* CANTIDAD Y CONFIGURACIÓN DE SERIALES */}
          {selectedVariant && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Cantidad de Items *
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="autoGenerate"
                    checked={formData.autoGenerateSerials}
                    onCheckedChange={(checked) =>
                      {
                        const auto = checked as boolean;
                        setFormData({
                          ...formData,
                          autoGenerateSerials: auto,
                          serialCodes: [],
                        });
                        if (auto) {
                          refreshGeneratedCodes(
                            formData.quantity,
                            formData.prefix,
                            selectedVariant?.variantCode,
                            auto,
                          );
                        } else {
                          setGeneratedCodes([]);
                        }
                      }
                    }
                  />
                  <Label
                    htmlFor="autoGenerate"
                    className="text-sm cursor-pointer"
                  >
                    Autogenerar códigos QR
                  </Label>
                </div>
              </div>

              <Input
                type="number"
                min={1}
                max={100}
                value={formData.quantity}
                onChange={(e) =>
                  {
                    const quantity = parseInt(e.target.value) || 1;
                    setFormData({
                      ...formData,
                      quantity,
                    });
                    if (formData.autoGenerateSerials) {
                      refreshGeneratedCodes(quantity);
                    }
                  }
                }
              />

              {formData.autoGenerateSerials && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Prefijo del Serial</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={regenerateCodes}
                      className="h-6 gap-1 text-xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerar
                    </Button>
                  </div>
                  <Input
                    value={formData.prefix}
                    onChange={(e) =>
                      {
                        const prefix = e.target.value.toUpperCase();
                        setFormData({
                          ...formData,
                          prefix,
                        });
                        if (formData.autoGenerateSerials) {
                          refreshGeneratedCodes(formData.quantity, prefix);
                        }
                      }
                    }
                    placeholder="Ej: IPHONE, VESTIDO"
                    className="font-mono uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formatos generados: {formData.prefix}-
                    {selectedVariant.variantCode.replace(/-/g, "").slice(0, 8)}
                    -XXXX-XXX
                  </p>
                </div>
              )}

              {/* Preview de códigos generados */}
              {formData.autoGenerateSerials && generatedCodes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    {generatedCodes.length} códigos generados:
                  </Label>
                  <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-background rounded border">
                    {generatedCodes.map((code, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs font-mono"
                      >
                        <span className="text-muted-foreground w-6">
                          {idx + 1}.
                        </span>
                        <span className="truncate">{code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input manual de seriales */}
              {!formData.autoGenerateSerials && formData.quantity && (
                <div className="space-y-2">
                  <Label className="text-sm text-amber-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Ingresa los códigos manualmente
                  </Label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {Array.from({ length: formData.quantity }).map((_, idx) => (
                      <Input
                        key={idx}
                        placeholder={`Serial #${idx + 1}`}
                        value={formData.serialCodes?.[idx] || ""}
                        onChange={(e) =>
                          handleManualSerialChange(idx, e.target.value)
                        }
                        className="font-mono uppercase"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Último Mantenimiento
              </Label>
              <Input
                type="date"
                value={
                  formData.lastMaintenance
                    ? formData.lastMaintenance.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastMaintenance: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileWarning className="w-4 h-4" />
                Observaciones de Daño
              </Label>
              <Input
                value={formData.damageNotes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, damageNotes: e.target.value })
                }
                placeholder="Ej: Botón suelto, rayón leve..."
              />
            </div>
          </div>

          {/* CONDICIÓN Y ESTADO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Condición
              </Label>
              <Select
                value={formData.condition}
              onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    condition: val as SerializedItemFormData["condition"],
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

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Estado Inicial
              </Label>
              <Select
                value={formData.status}
              onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    status: val as SerializedItemFormData["status"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* USOS DEL PRODUCTO PADRE */}
          <div className="space-y-3 rounded-md border p-3 bg-muted/30">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Política comercial del producto
            </Label>
            <div className="flex gap-2 flex-wrap">
              {selectedProduct ? (
                <>
                  {selectedProduct.can_rent && <Badge variant="secondary">Renta</Badge>}
                  {selectedProduct.can_sell && <Badge variant="secondary">Venta</Badge>}
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

          {/* BOTÓN SUBMIT */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              !selectedProduct ||
              !selectedVariant ||
              !formData.branchId ||
              !selectedSerialCodes.length ||
              selectedSerialCodes.some((code) => !code.trim())
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear {formData.quantity} Item{formData.quantity !== 1 ? "s" : ""}{" "}
            Serializado{formData.quantity !== 1 ? "s" : ""}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
