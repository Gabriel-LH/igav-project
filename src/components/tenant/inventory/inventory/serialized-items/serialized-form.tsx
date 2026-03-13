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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  Package,
  QrCode,
  Store,
  Settings,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Wrench,
  RefreshCw,
  Calendar,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarcodeScanner } from "../barcode/BarcodeScanner";
import { SerializedItemFormData } from "@/src/application/interfaces/inventory/SerializedItemFormData";
import { useInventoryProductOptions } from "@/src/hooks/inventory/useInventoryProductOptions";
import { useIsMobile } from "@/src/hooks/use-mobile";

const CONDITION_OPTIONS = [
  { value: "Nuevo", label: "Nuevo", color: "green" },
  { value: "Usado", label: "Usado", color: "orange" },
  { value: "Vintage", label: "Vintage", color: "purple" },
];

const STATUS_OPTIONS = [
  { value: "en_transito", label: "En Tránsito", color: "blue" },
  { value: "disponible", label: "Disponible", color: "green" },
];

type BatchState = {
  enabled: boolean;
  quantity: number;
  prefix: string;
  autoGenerate: boolean;
  manualCodes: string[];
  generatedCodes: string[];
};

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

export function SerializedItemForm({ onSubmit }: SerializedItemFormProps) {
  const availableProducts = useInventoryProductOptions(true);
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState<Partial<SerializedItemFormData>>({
    condition: "Nuevo",
    status: "en_transito",
    damageNotes: "",
  });

  const [batches, setBatches] = useState<{
    rent: BatchState;
    sale: BatchState;
  }>({
    rent: {
      enabled: false,
      quantity: 1,
      prefix: "RENT",
      autoGenerate: true,
      manualCodes: [],
      generatedCodes: [],
    },
    sale: {
      enabled: false,
      quantity: 1,
      prefix: "SALE",
      autoGenerate: true,
      manualCodes: [],
      generatedCodes: [],
    },
  });

  const [scanMessage, setScanMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const MOCK_BRANCHES = useMemo(() => {
    return [
      { id: "branch-1", name: "Sucursal 1", status: "active" },
      { id: "branch-2", name: "Sucursal 2", status: "active" },
    ];
  }, []);

  const selectedProduct = availableProducts.find(
    (p) => p.id === formData.productId,
  );
  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.id === formData.variantId,
  );
  const availableBranches = useMemo(
    () => MOCK_BRANCHES.filter((branch) => branch.status === "active"),
    [MOCK_BRANCHES],
  );
  const selectedBranch = availableBranches.find(
    (b) => b.id === formData.branchId,
  );

  const refreshGeneratedCodes = (
    type: "rent" | "sale",
    quantity: number,
    prefix: string,
    variantCode: string,
  ) => {
    if (!quantity || !prefix || !variantCode) {
      setBatches((prev) => ({
        ...prev,
        [type]: { ...prev[type], generatedCodes: [] },
      }));
      return;
    }

    const codes = generateSerialCodes(prefix, variantCode, quantity, []);
    setBatches((prev) => ({
      ...prev,
      [type]: { ...prev[type], generatedCodes: codes },
    }));
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
    setScanMessage({ type: "error", text: "Código no encontrado" });
  };

  const handleManualSerialChange = (
    type: "rent" | "sale",
    index: number,
    value: string,
  ) => {
    setBatches((prev) => {
      const newManual = [...prev[type].manualCodes];
      newManual[index] = value.toUpperCase();
      return { ...prev, [type]: { ...prev[type], manualCodes: newManual } };
    });
  };

  const regenerateCodes = (type: "rent" | "sale") => {
    if (!selectedVariant) return;
    refreshGeneratedCodes(
      type,
      batches[type].quantity,
      batches[type].prefix,
      selectedVariant.variantCode,
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedVariant || !formData.branchId) return;

    (["rent", "sale"] as const).forEach((type) => {
      const batch = batches[type];
      if (batch.enabled && batch.quantity > 0) {
        const codes = batch.autoGenerate
          ? batch.generatedCodes
          : batch.manualCodes;
        if (codes.length > 0 && !codes.some((c) => !c.trim())) {
          onSubmit({
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            variantId: selectedVariant.id,
            variantName: selectedVariant.name,
            variantCode: selectedVariant.variantCode,
            variantBarcode: selectedVariant.barcode,
            branchId: formData.branchId!,
            branchName: selectedBranch?.name || "",
            quantity: batch.quantity,
            serialCodes: codes,
            isForRent: type === "rent",
            isForSale: type === "sale",
            condition: formData.condition || "Nuevo",
            status: formData.status || "disponible",
            expirationDate: formData.expirationDate,
            damageNotes: formData.damageNotes,
            autoGenerateSerials: batch.autoGenerate,
            prefix: batch.prefix,
          });
        }
      }
    });

    setFormData({ condition: "Nuevo", status: "en_transito", damageNotes: "" });
    setBatches({
      rent: {
        enabled: false,
        quantity: 1,
        prefix: "RENT",
        autoGenerate: true,
        manualCodes: [],
        generatedCodes: [],
      },
      sale: {
        enabled: false,
        quantity: 1,
        prefix: "SALE",
        autoGenerate: true,
        manualCodes: [],
        generatedCodes: [],
      },
    });
    setScanMessage(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex text-2xl mb-4 items-center gap-2">
        <QrCode className="w-5 h-5" />
        Nuevo Item Serializado
      </div>

      <div className="space-y-4">
        <div className="grid lg:grid-cols-4 gap-4 grid-cols-1">
          <div className="space-y-2">
            <Label>Producto *</Label>
            <Select
              value={formData.productId}
              onValueChange={(val) => {
                setFormData({
                  ...formData,
                  productId: val,
                  variantId: undefined,
                });
                setBatches({
                  rent: {
                    ...batches.rent,
                    generatedCodes: [],
                    manualCodes: [],
                  },
                  sale: {
                    ...batches.sale,
                    generatedCodes: [],
                    manualCodes: [],
                  },
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto..." />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                {availableBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Variante *
            </Label>
            <div className="flex gap-4">
              <Select
                value={formData.variantId}
                onValueChange={(val) => {
                  const variant = selectedProduct?.variants.find(
                    (v) => v.id === val,
                  );
                  if (variant) {
                    setFormData({ ...formData, variantId: val });
                    if (batches.rent.enabled && batches.rent.autoGenerate)
                      refreshGeneratedCodes(
                        "rent",
                        batches.rent.quantity,
                        batches.rent.prefix,
                        variant.variantCode,
                      );
                    if (batches.sale.enabled && batches.sale.autoGenerate)
                      refreshGeneratedCodes(
                        "sale",
                        batches.sale.quantity,
                        batches.sale.prefix,
                        variant.variantCode,
                      );
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
                  {selectedProduct?.variants.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{v.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {v.variantCode} • Barcode: {v.barcode}
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
                      Escanear Variante
                    </h4>
                    <BarcodeScanner onScan={handleScan} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {scanMessage && (
          <div
            className={cn(
              "flex items-center gap-2 text-sm p-2 rounded-md",
              scanMessage.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200",
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

        {selectedVariant && (
          <div className="space-y-4">
            <Accordion
              type="multiple"
              defaultValue={["rent", "sale"]}
              className="w-full"
            >
              {(selectedProduct?.can_rent || !selectedProduct) && (
                <AccordionItem
                  value="rent"
                  className="border rounded-lg bg-card px-4 mb-4"
                >
                  <div className="flex items-center justify-between py-2">
                    <AccordionTrigger className="hover:no-underline py-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-full",
                            batches.rent.enabled
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm">
                            Generador para Alquiler
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Artículos destinados a renta
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <Switch
                      checked={batches.rent.enabled}
                      onCheckedChange={(checked) => {
                        setBatches((prev) => ({
                          ...prev,
                          rent: { ...prev.rent, enabled: checked },
                        }));
                        if (checked && selectedVariant)
                          refreshGeneratedCodes(
                            "rent",
                            batches.rent.quantity,
                            batches.rent.prefix,
                            selectedVariant.variantCode,
                          );
                      }}
                      disabled={!selectedProduct?.can_rent}
                      className="ml-4"
                    />
                  </div>
                  <AccordionContent className="pt-2 pb-4 space-y-4 border-t mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Cantidad *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={batches.rent.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 1;
                            setBatches((prev) => ({
                              ...prev,
                              rent: { ...prev.rent, quantity: qty },
                            }));
                            if (batches.rent.autoGenerate && selectedVariant)
                              refreshGeneratedCodes(
                                "rent",
                                qty,
                                batches.rent.prefix,
                                selectedVariant.variantCode,
                              );
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Prefijo</Label>
                        <Input
                          value={batches.rent.prefix}
                          onChange={(e) => {
                            const pfx = e.target.value.toUpperCase();
                            setBatches((prev) => ({
                              ...prev,
                              rent: { ...prev.rent, prefix: pfx },
                            }));
                            if (batches.rent.autoGenerate && selectedVariant)
                              refreshGeneratedCodes(
                                "rent",
                                batches.rent.quantity,
                                pfx,
                                selectedVariant.variantCode,
                              );
                          }}
                          className="font-mono uppercase"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="auto-rent"
                        checked={batches.rent.autoGenerate}
                        onCheckedChange={(checked) =>
                          setBatches((prev) => ({
                            ...prev,
                            rent: { ...prev.rent, autoGenerate: !!checked },
                          }))
                        }
                      />
                      <Label
                        htmlFor="auto-rent"
                        className="text-sm cursor-pointer"
                      >
                        Autogenerar códigos QR
                      </Label>
                      {batches.rent.autoGenerate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => regenerateCodes("rent")}
                          className="h-6 ml-auto gap-1 text-[10px]"
                        >
                          <RefreshCw className="w-3 h-3" /> Regenerar
                        </Button>
                      )}
                    </div>
                    {batches.rent.autoGenerate ? (
                      <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-muted/50 rounded border text-xs font-mono">
                        {batches.rent.generatedCodes.map((c, i) => (
                          <div
                            key={i}
                            className="flex gap-2 text-muted-foreground"
                          >
                            <span className="w-4">{i + 1}.</span>
                            <span className="truncate">{c}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Array.from({ length: batches.rent.quantity }).map(
                          (_, i) => (
                            <Input
                              key={i}
                              placeholder={`Serial #${i + 1}`}
                              value={batches.rent.manualCodes[i] || ""}
                              onChange={(e) =>
                                handleManualSerialChange(
                                  "rent",
                                  i,
                                  e.target.value,
                                )
                              }
                              className="font-mono uppercase text-xs h-8"
                            />
                          ),
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {(selectedProduct?.can_sell || !selectedProduct) && (
                <AccordionItem
                  value="sale"
                  className="border rounded-lg bg-card px-4"
                >
                  <div className="flex items-center justify-between py-2">
                    <AccordionTrigger className="hover:no-underline py-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-full",
                            batches.sale.enabled
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm">
                            Generador para Venta
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Artículos destinados a venta directa
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <Switch
                      checked={batches.sale.enabled}
                      onCheckedChange={(checked) => {
                        setBatches((prev) => ({
                          ...prev,
                          sale: { ...prev.sale, enabled: checked },
                        }));
                        if (checked && selectedVariant)
                          refreshGeneratedCodes(
                            "sale",
                            batches.sale.quantity,
                            batches.sale.prefix,
                            selectedVariant.variantCode,
                          );
                      }}
                      disabled={!selectedProduct?.can_sell}
                      className="ml-4"
                    />
                  </div>
                  <AccordionContent className="pt-2 pb-4 space-y-4 border-t mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Cantidad *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={batches.sale.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 1;
                            setBatches((prev) => ({
                              ...prev,
                              sale: { ...prev.sale, quantity: qty },
                            }));
                            if (batches.sale.autoGenerate && selectedVariant)
                              refreshGeneratedCodes(
                                "sale",
                                qty,
                                batches.sale.prefix,
                                selectedVariant.variantCode,
                              );
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Prefijo</Label>
                        <Input
                          value={batches.sale.prefix}
                          onChange={(e) => {
                            const pfx = e.target.value.toUpperCase();
                            setBatches((prev) => ({
                              ...prev,
                              sale: { ...prev.sale, prefix: pfx },
                            }));
                            if (batches.sale.autoGenerate && selectedVariant)
                              refreshGeneratedCodes(
                                "sale",
                                batches.sale.quantity,
                                pfx,
                                selectedVariant.variantCode,
                              );
                          }}
                          className="font-mono uppercase"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="auto-sale"
                        checked={batches.sale.autoGenerate}
                        onCheckedChange={(checked) =>
                          setBatches((prev) => ({
                            ...prev,
                            sale: { ...prev.sale, autoGenerate: !!checked },
                          }))
                        }
                      />
                      <Label
                        htmlFor="auto-sale"
                        className="text-sm cursor-pointer"
                      >
                        Autogenerar códigos QR
                      </Label>
                      {batches.sale.autoGenerate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => regenerateCodes("sale")}
                          className="h-6 ml-auto gap-1 text-[10px]"
                        >
                          <RefreshCw className="w-3 h-3" /> Regenerar
                        </Button>
                      )}
                    </div>
                    {batches.sale.autoGenerate ? (
                      <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-muted/50 rounded border text-xs font-mono">
                        {batches.sale.generatedCodes.map((c, i) => (
                          <div
                            key={i}
                            className="flex gap-2 text-muted-foreground"
                          >
                            <span className="w-4">{i + 1}.</span>
                            <span className="truncate">{c}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Array.from({ length: batches.sale.quantity }).map(
                          (_, i) => (
                            <Input
                              key={i}
                              placeholder={`Serial #${i + 1}`}
                              value={batches.sale.manualCodes[i] || ""}
                              onChange={(e) =>
                                handleManualSerialChange(
                                  "sale",
                                  i,
                                  e.target.value,
                                )
                              }
                              className="font-mono uppercase text-xs h-8"
                            />
                          ),
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
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
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileWarning className="w-4 h-4" />
              Observaciones
            </Label>
            <Input
              value={formData.damageNotes || ""}
              onChange={(e) =>
                setFormData({ ...formData, damageNotes: e.target.value })
              }
              placeholder="Observaciones..."
            />
          </div>
        </div>

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

        <Button
          type="submit"
          className="w-full font-bold"
          size="lg"
          disabled={
            !selectedProduct ||
            !selectedVariant ||
            !formData.branchId ||
            !(
              (batches.rent.enabled &&
                (batches.rent.autoGenerate
                  ? batches.rent.generatedCodes.length > 0
                  : batches.rent.manualCodes.filter((c) => c.trim()).length ===
                    batches.rent.quantity)) ||
              (batches.sale.enabled &&
                (batches.sale.autoGenerate
                  ? batches.sale.generatedCodes.length > 0
                  : batches.sale.manualCodes.filter((c) => c.trim()).length ===
                    batches.sale.quantity))
            )
          }
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Items Serializados
        </Button>
      </div>
    </form>
  );
}
