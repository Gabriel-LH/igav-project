// components/inventory/VariantsTable.tsx
"use client";

import { useState, useCallback, useMemo, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calculator,
  RotateCcw,
  Barcode,
  ScanLine,
  Printer,
  Eye,
  Package,
  AlertTriangle,
  Hash,
  Copy,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Combine,
} from "lucide-react";
import {
  ComputedVariant,
  VariantOverride,
} from "@/src/application/interfaces/ProductForm";
import { cn } from "@/lib/utils";
import { generateBarcode } from "@/src/utils/variants/barcode";
import { BarcodeDisplay } from "../../barcode/BarcodeDisplay";
import { BarcodeScanner } from "../../barcode/BarcodeScanner";
import { SingleImagePicker } from "../ui/SingleImagePicker";

interface VariantsTableProps {
  baseSku: string;
  variants: ComputedVariant[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    withOverrides: number;
    combinationFormula: string;
  };
  isSerial: boolean;
  canRent: boolean;
  canSell: boolean;
  onUpdateOverride: (
    signature: string,
    override: Partial<VariantOverride>,
  ) => void;
  onResetOverride: (signature: string) => void;
  onResetAll: () => void;
  existingImages?: string[];
  variantOverrides: Record<string, VariantOverride>;
}

const RENT_UNITS = [
  { value: "hora", label: "Hora" },
  { value: "dia", label: "Día" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
  { value: "evento", label: "Evento" },
];

const unidadesRenta = RENT_UNITS;

export function VariantsTable({
  baseSku,
  variants,
  stats,
  isSerial,
  canRent,
  canSell,
  onUpdateOverride,
  onResetOverride,
  onResetAll,
  existingImages = [],
  variantOverrides,
}: VariantsTableProps) {
  // Estados locales SOLO para los inputs de aplicación global
  const [globalPriceRent, setGlobalPriceRent] = useState("");
  const [globalPriceSell, setGlobalPriceSell] = useState("");
  const [globalPurchasePrice, setGlobalPurchasePrice] = useState(""); // NUEVO
  const [globalUnit, setGlobalUnit] = useState("");
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  // --- Selección de variantes ---
  const [selectedSignatures, setSelectedSignatures] = useState<Set<string>>(
    new Set(),
  );

  const toggleSelection = useCallback((signature: string) => {
    setSelectedSignatures((prev) => {
      const next = new Set(prev);
      if (next.has(signature)) {
        next.delete(signature);
      } else {
        next.add(signature);
      }
      return next;
    });
  }, []);

  const pageCount = Math.max(1, Math.ceil(variants.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const paginatedVariants = useMemo(
    () =>
      variants.slice(
        safePageIndex * pageSize,
        safePageIndex * pageSize + pageSize,
      ),
    [variants, safePageIndex, pageSize],
  );

  const toggleAllPage = useCallback(() => {
    const allPageSelected = paginatedVariants.every((v) =>
      selectedSignatures.has(v.signature),
    );
    setSelectedSignatures((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        paginatedVariants.forEach((v) => next.delete(v.signature));
      } else {
        paginatedVariants.forEach((v) => next.add(v.signature));
      }
      return next;
    });
  }, [paginatedVariants, selectedSignatures]);

  // Aplicar precio de renta en masa
  const applyGlobalRentPrice = useCallback(() => {
    if (!canRent) return;
    const numValue = parseFloat(globalPriceRent);
    if (isNaN(numValue)) return;

    const targets =
      selectedSignatures.size > 0
        ? variants.filter((v) => selectedSignatures.has(v.signature))
        : variants.filter((v) => v.isActive);

    targets.forEach((variant) => {
      onUpdateOverride(variant.signature, { priceRent: numValue });
    });
  }, [canRent, globalPriceRent, variants, onUpdateOverride, selectedSignatures]);

  // Aplicar precio de venta en masa
  const applyGlobalSellPrice = useCallback(() => {
    if (!canSell) return;
    const numValue = parseFloat(globalPriceSell);
    if (isNaN(numValue)) return;

    const targets =
      selectedSignatures.size > 0
        ? variants.filter((v) => selectedSignatures.has(v.signature))
        : variants.filter((v) => v.isActive);

    targets.forEach((variant) => {
      onUpdateOverride(variant.signature, { priceSell: numValue });
    });
  }, [canSell, globalPriceSell, variants, onUpdateOverride, selectedSignatures]);

  // Aplicar unidad en masa
  const applyGlobalUnit = useCallback(() => {
    if (!canRent) return;
    if (!globalUnit) return;

    const targets =
      selectedSignatures.size > 0
        ? variants.filter((v) => selectedSignatures.has(v.signature))
        : variants.filter((v) => v.isActive);

    targets.forEach((variant) => {
      onUpdateOverride(variant.signature, { rentUnit: globalUnit });
    });
  }, [canRent, globalUnit, variants, onUpdateOverride, selectedSignatures]);

  const applyGlobalPurchasePrice = useCallback(() => {
    const numValue = parseFloat(globalPurchasePrice);
    if (isNaN(numValue)) return;

    const targets =
      selectedSignatures.size > 0
        ? variants.filter((v) => selectedSignatures.has(v.signature))
        : variants.filter((v) => v.isActive);

    targets.forEach((v) => {
      onUpdateOverride(v.signature, { purchasePrice: numValue });
    });
  }, [
    globalPurchasePrice,
    variants,
    onUpdateOverride,
    selectedSignatures,
  ]);

  // --- Lógica de Ganancia y Margen (Basada en variantes paginadas o totales) ---
  const calculateMetrics = () => {
    const activeVariants = variants.filter(
      (v) => v.isActive && (v.priceSell || 0) > 0,
    );
    if (activeVariants.length === 0) return { profit: 0, margin: 0 };

    const totalSell = activeVariants.reduce(
      (acc, v) => acc + (v.priceSell || 0),
      0,
    );
    const totalCost = activeVariants.reduce(
      (acc, v) => acc + (v.purchasePrice || 0),
      0,
    );
    const avgProfit = (totalSell - totalCost) / activeVariants.length;
    const avgMargin =
      totalSell > 0 ? ((totalSell - totalCost) / totalSell) * 100 : 0;

    return { profit: avgProfit, margin: avgMargin };
  };

  const { profit, margin } = calculateMetrics();

  const skuCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    variants.forEach((v) => {
      counts[v.variantCode] = (counts[v.variantCode] || 0) + 1;
    });
    return counts;
  }, [variants]);

  const copyBarcode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBarcode(code);
    setTimeout(() => setCopiedBarcode(null), 2000);
  }, []);

  // Generar barcode para una variante específica
  const handleGenerateBarcode = useCallback(
    (variant: ComputedVariant, index: number) => {
      const newBarcode = generateBarcode(baseSku, variant.attributes, index);
      onUpdateOverride(variant.signature, { barcode: newBarcode });
    },
    [baseSku, onUpdateOverride],
  );

  const getAttributeKeys = useCallback(() => {
    if (variants.length === 0) return [];
    return Object.keys(variants[0].attributes);
  }, [variants]);

  if (variants.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay variantes configuradas.</p>
          <p className="text-sm">
            Ve a la pestaña &quot;Atributos&quot; para seleccionar Color, Talla,
            etc.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isAllPageSelected =
    paginatedVariants.length > 0 &&
    paginatedVariants.every((v) => selectedSignatures.has(v.signature));

  const canPreviousPage = safePageIndex > 0;
  const canNextPage = safePageIndex < pageCount - 1;

  return (
    <div className="space-y-6">
      {/* Resumen superior */}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Combine className="w-5 h-5 text-primary" />
              {stats.total} variantes generadas
            </h3>
            <p className="text-sm text-muted-foreground">
              Basado en:{" "}
              <span className="font-medium text-foreground">
                {stats.combinationFormula}
              </span>
            </p>
          </div>

          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <div className="text-muted-foreground">Activas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.inactive}
              </div>
              <div className="text-muted-foreground">Inactivas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.withOverrides}
              </div>
              <div className="text-muted-foreground">Editadas</div>
            </div>
          </div>
        </div>

        {isSerial && (
          <div className="mt-4 p-3 border bg-primary/5 rounded-lg flex items-center gap-2 text-amber-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              <strong>Modo Serializado:</strong> Cada variante representa un
              ítem único. El stock se gestionará por números de serie
              individuales.
            </span>
          </div>
        )}
      </div>

      {/* Aplicar valores en masa - CADA UNO INDEPENDIENTE */}
      <div>
        <h3 className="text-sm font-medium flex mb-3 items-center gap-2">
          <Calculator className="w-4 h-4" />
          Aplicar valores masivamente (opcional)
        </h3>
        <div>
          <div className="flex gap-4 items-end flex-wrap">
            {canRent && (
              <div className="space-y-2">
                <label className="text-xs font-medium">Precio Renta</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-32 h-8"
                    value={globalPriceRent}
                    onChange={(e) => setGlobalPriceRent(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={applyGlobalRentPrice}
                    disabled={!globalPriceRent || globalPriceRent === "0"}
                    type="button"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}

            {canRent && (
              <div className="space-y-2">
                <label className="text-xs font-medium">Unidad Renta</label>
                <div className="flex gap-2">
                  <Select
                    value={globalUnit}
                    onValueChange={(e) => setGlobalUnit(e)}
                  >
                    <SelectTrigger className="w-full max-w-48">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesRenta.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={applyGlobalUnit}
                    disabled={!globalUnit}
                    type="button"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}

            {/* COSTO DE COMPRA MASIVO */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                Costo Compra
              </Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  className="w-24 h-9"
                  value={globalPurchasePrice}
                  onChange={(e) => setGlobalPurchasePrice(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={applyGlobalPurchasePrice}
                  disabled={!globalPurchasePrice}
                  type="button"
                >
                  Fijar Costo
                </Button>
              </div>
            </div>

            {canSell && (
              <div className="space-y-2">
                <label className="text-xs font-medium">Precio Venta</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-32 h-8"
                    value={globalPriceSell}
                    onChange={(e) => setGlobalPriceSell(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={applyGlobalSellPrice}
                    disabled={!globalPriceSell || globalPriceSell === "0"}
                    type="button"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onResetAll}
              className="gap-2 ml-auto"
              type="button"
            >
              <RotateCcw className="w-4 h-4" />
              Resetear todo
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla de variantes */}

      <div className="overflow-x-auto w-full max-w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={isAllPageSelected}
                  onCheckedChange={toggleAllPage}
                  aria-label="Select all on page"
                />
              </TableHead>
              <TableHead className="w-12 text-center">Activo</TableHead>
              <TableHead className="w-11 text-center">Imagen</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  SKU
                </div>
              </TableHead>

              <TableHead>
                <div className="flex items-center gap-1">
                  <Barcode className="w-3 h-3" />
                  Código de Barras
                </div>
              </TableHead>
              {getAttributeKeys().map((key) => (
                <TableHead key={key}>{key}</TableHead>
              ))}
              <TableHead>
                <div className="flex items-center gap-1">
                  <span>S/.</span>
                  Costo de compra
                </div>
              </TableHead>
              {canRent && (
                <TableHead>
                  <div className="flex items-center gap-1">
                    <span>S/.</span>
                    Precio Renta
                  </div>
                </TableHead>
              )}
              {canRent && <TableHead>Tiempo</TableHead>}
              {canSell && (
                <TableHead>
                  <div className="flex items-center gap-1">
                    <span>S/.</span>
                    Precio Venta
                  </div>
                </TableHead>
              )}
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVariants.map((variant, index) => {
              const globalIndex = safePageIndex * pageSize + index;
              return (
                <VariantRow
                  key={variant.signature}
                  variant={variant}
                  onUpdateOverride={onUpdateOverride}
                  onResetOverride={onResetOverride}
                  onGenerateBarcode={() =>
                    handleGenerateBarcode(variant, globalIndex)
                  }
                  onCopyBarcode={copyBarcode}
                  copiedBarcode={copiedBarcode}
                  canRent={canRent}
                  canSell={canSell}
                  existingImages={existingImages}
                  variantOverrides={variantOverrides}
                  isSelected={selectedSignatures.has(variant.signature)}
                  onToggleSelection={toggleSelection}
                  isDuplicateSku={skuCounts[variant.variantCode] > 1}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 gap-4">
        {/* Métricas de Rentabilidad */}
        {canSell && margin < 10 && profit < 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {profit < 0 && (
              <div className="flex flex-col">
                <span className="text-red-400 text-xs">
                  Tu venta esta menos que tu compra, revisa tus precios.
                </span>
              </div>
            )}
            {margin < 10 && (
              <div className="flex flex-col sm:border-l sm:pl-6">
                <span className="text-xs text-yellow-400">
                  El margen de ganancia debe de ser mayor al 10% o 15% para que
                  sea rentable.
                </span>
              </div>
            )}
          </div>
        )}
        <div className="flex w-full items-center justify-end gap-4 sm:gap-8 lg:w-fit lg:ml-auto flex-wrap sm:flex-nowrap">
          <div className="hidden items-center gap-2 lg:flex">
            <Label
              htmlFor="rows-per-page-variant"
              className="text-sm font-medium"
            >
              Filas por pagina
            </Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPageIndex(0);
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-20"
                id="rows-per-page-variant"
              >
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Pagina {safePageIndex + 1} de {pageCount}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPageIndex(0)}
              disabled={!canPreviousPage}
            >
              <span className="sr-only">Ir a la primera pagina</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              disabled={!canPreviousPage}
            >
              <span className="sr-only">Ir a la pagina anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() =>
                setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))
              }
              disabled={!canNextPage}
            >
              <span className="sr-only">Ir a la pagina siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => setPageIndex(pageCount - 1)}
              disabled={!canNextPage}
            >
              <span className="sr-only">Ir a la ultima pagina</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de fila individual - COMPLETAMENTE INDEPENDIENTE
interface VariantRowProps {
  variant: ComputedVariant;
  onUpdateOverride: (
    signature: string,
    override: Partial<VariantOverride>,
  ) => void;
  onResetOverride: (signature: string) => void;
  onGenerateBarcode: () => void;
  onCopyBarcode: (code: string) => void;
  copiedBarcode: string | null;
  canRent: boolean;
  canSell: boolean;
  existingImages?: string[];
  variantOverrides: Record<string, VariantOverride>;
  isSelected: boolean;
  onToggleSelection: (signature: string) => void;
  isDuplicateSku?: boolean;
}

const VariantRow = memo(function VariantRow({
  variant,
  onUpdateOverride,
  onResetOverride,
  onGenerateBarcode,
  onCopyBarcode,
  copiedBarcode,
  canRent,
  canSell,
  existingImages = [],
  variantOverrides,
  isSelected,
  onToggleSelection,
  isDuplicateSku,
}: VariantRowProps) {
  const localRentPrice = variant.priceRent ? String(variant.priceRent) : "";
  const localSellPrice = variant.priceSell ? String(variant.priceSell) : "";
  const localBarcode = variant.barcode || "";
  const localPurchasePrice =
    variant.purchasePrice !== undefined ? String(variant.purchasePrice) : "";

  const handlePurchasePriceChange = (value: string) => {
    const num = value === "" ? 0 : parseFloat(value);
    if (!isNaN(num)) {
      onUpdateOverride(variant.signature, { purchasePrice: num });
    }
  };

  const handleRentPriceChange = (value: string) => {
    if (value === "") {
      onUpdateOverride(variant.signature, { priceRent: 0 });
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdateOverride(variant.signature, { priceRent: num });
    }
  };

  const handleSellPriceChange = (value: string) => {
    if (value === "") {
      onUpdateOverride(variant.signature, { priceSell: 0 });
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdateOverride(variant.signature, { priceSell: num });
    }
  };

  const handleBarcodeChange = (value: string) => {
    onUpdateOverride(variant.signature, { barcode: value });
  };

  const handleUnitChange = (value: string) => {
    onUpdateOverride(variant.signature, { rentUnit: value });
  };

  const attributeKeys = useMemo(
    () => Object.keys(variant.attributes),
    [variant.attributes],
  );

  const cost = variant.purchasePrice || 0;
  const price = variant.priceSell || 0;
  const profit = price - cost;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  const override = variantOverrides[variant.signature];
  const isBarcodeOverridden = override?.barcode !== undefined;
  const isPurchasePriceOverridden = override?.purchasePrice !== undefined;
  const isVariantCodeOverridden = override?.variantCode !== undefined;
  const isPriceRentOverridden = override?.priceRent !== undefined;
  const isPriceSellOverridden = override?.priceSell !== undefined;
  const isRentUnitOverridden = override?.rentUnit !== undefined;

  return (
    <TableRow
      className={cn(
        !variant.isActive && "opacity-50 bg-muted/20",
        isSelected && "bg-primary/5",
      )}
    >
      {/* Selección */}
      <TableCell className="text-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(variant.signature)}
          aria-label={`Select ${variant.variantCode}`}
        />
      </TableCell>
      {/* Activo */}
      <TableCell className="text-center">
        <Switch
          checked={variant.isActive}
          onCheckedChange={(checked) =>
            onUpdateOverride(variant.signature, { isActive: checked })
          }
        />
      </TableCell>
      {/* IMAGEN DE VARIANTE en VariantRow */}
      <TableCell>
        <SingleImagePicker
          value={
            Array.isArray(variant.images)
              ? variant.images[0]
              : variant.images || ""
          }
          onChange={(url) =>
            onUpdateOverride(variant.signature, { images: [url] })
          }
          disabled={!variant.isActive}
          existingImages={existingImages}
        />
      </TableCell>

      {/* SKU */}
      <TableCell>
        <Input
          value={variant.variantCode}
          onChange={(e) =>
            onUpdateOverride(variant.signature, { variantCode: e.target.value })
          }
          className={cn(
            "h-8 font-mono text-xs w-30 transition-colors",
            isVariantCodeOverridden && "border-amber-500 bg-amber-50/30",
            isDuplicateSku && "border-red-500 bg-red-50",
          )}
          disabled={!variant.isActive}
        />
      </TableCell>

      {/* Barcode */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            value={localBarcode}
            onChange={(e) => handleBarcodeChange(e.target.value)}
            className={cn(
              "h-8 font-mono text-xs w-31 transition-colors",
              isBarcodeOverridden && "border-amber-500 bg-amber-50/30",
              localBarcode.includes("NaN") && "border-red-500 bg-red-50", // Resaltar error
            )}
            disabled={!variant.isActive}
            placeholder="1234567890123"
            maxLength={13}
          />

          {localBarcode.includes("NaN") && (
            <span className="text-red-500 text-xs">Inválido</span>
          )}

          <div className="flex gap-1">
            {/* Ver/Imprimir */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={!variant.isActive || !localBarcode}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Barcode className="w-5 h-5" />
                    Código: {variant.variantCode}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <BarcodeDisplay
                    value={localBarcode || "0000000000000"}
                    title={variant.attributes[attributeKeys[0]] || "Variante"}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => onCopyBarcode(localBarcode)}
                    >
                      {copiedBarcode === localBarcode ? (
                        <>
                          <Check className="w-4 h-4" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copiar
                        </>
                      )}
                    </Button>
                    <Button className="gap-2" onClick={() => window.print()}>
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Escanear */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={!variant.isActive}
                >
                  <ScanLine className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <ScanLine className="w-4 h-4" />
                    Escanear Código
                  </h4>
                  <BarcodeScanner
                    onScan={(code) => handleBarcodeChange(code)}
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Autogenerar */}
            {localBarcode.includes("NaN") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500"
                onClick={onGenerateBarcode}
                title="Regenerar código"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </TableCell>

      {/* Atributos */}
      {attributeKeys.map((key) => (
        <TableCell key={key}>
          <Badge variant="secondary" className="font-normal">
            {variant.attributes[key]}
          </Badge>
        </TableCell>
      ))}

      <TableCell>
        <div className="flex flex-col gap-1">
          <Input
            type="number"
            step="0.01"
            value={localPurchasePrice}
            onChange={(e) => handlePurchasePriceChange(e.target.value)}
            className={cn(
              "h-8 w-24 transition-colors",
              isPurchasePriceOverridden && "border-amber-500 bg-amber-50/30",
              variant.purchasePrice! > (variant.priceSell || 0) &&
                "border-red-500 bg-red-50",
            )}
            disabled={!variant.isActive}
            placeholder="0.00"
          />
        </div>
      </TableCell>

      {canRent && (
        <TableCell>
          <Input
            type="number"
            step="0.01"
            value={localRentPrice}
            onChange={(e) => handleRentPriceChange(e.target.value)}
            className={cn(
              "h-8 w-24 transition-colors",
              isPriceRentOverridden && "border-amber-500 bg-amber-50/30",
            )}
            disabled={!variant.isActive}
            placeholder="0.00"
          />
        </TableCell>
      )}

      {canRent && (
        <TableCell>
          <Select
            value={variant.rentUnit}
            onValueChange={(e) => handleUnitChange(e)}
            disabled={!variant.isActive}
          >
            <SelectTrigger
              className={cn(
                "h-8 w-24 transition-colors",
                isRentUnitOverridden && "border-amber-500 bg-amber-50/30",
              )}
            >
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {unidadesRenta.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}

      {canSell && (
        <TableCell>
          <Input
            type="number"
            step="0.01"
            value={localSellPrice}
            onChange={(e) => handleSellPriceChange(e.target.value)}
            className={cn(
              "h-8 w-24 transition-colors",
              isPriceSellOverridden && "border-amber-500 bg-amber-50/30",
            )}
            disabled={!variant.isActive}
            placeholder="0.00"
          />
        </TableCell>
      )}

      <TableCell className="min-w-[140px] border-l bg-muted/5">
        <div className="flex flex-col items-end gap-1 px-2">
          {/* Ganancia en Moneda */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">
              Ganancia:
            </span>
            <span
              className={cn(
                "text-xs font-bold flex items-center gap-1",
                profit > 0 ? "text-green-400" : "text-red-400",
              )}
            >
              {profit > 0 ? (
                <span>S/.</span>
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              {profit.toFixed(2)}
            </span>
          </div>
          {/* Margen en Porcentaje */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">
              Margen:
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[12px] h-5 px-1.5",
                margin > 25
                  ? "text-green-400"
                  : margin > 10
                    ? "text-amber-400"
                    : "text-red-400",
              )}
            >
              {margin.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </TableCell>

      {/* Reset */}
      <TableCell>
        {variant.hasOverride && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onResetOverride(variant.signature)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="Restaurar valores automáticos"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
});
