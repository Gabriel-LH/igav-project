// components/inventory/VariantsTable.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DollarSign,
  Copy,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  ComputedVariant,
  VariantOverride,
} from "@/src/application/interfaces/ProductForm";
import { cn } from "@/lib/utils";
import { generateBarcode } from "@/src/utils/variants/barcode";
import { BarcodeDisplay } from "../../barcode/BarcodeDisplay";

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
          "w-64 h-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors",
          scanning
            ? "border-green-500 bg-green-50 animate-pulse"
            : "border-muted hover:border-primary",
        )}
        onClick={!scanning ? simulateScan : undefined}
      >
        {scanning ? (
          <div className="text-center">
            <ScanLine className="w-12 h-12 text-green-500 mx-auto mb-2 animate-bounce" />
            <p className="text-sm text-green-600 font-medium">Escaneando...</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <ScanLine className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Haz clic para simular escaneo</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">O ingresa manualmente:</p>
        <div className="flex gap-2">
          <Input
            placeholder="1234567890123"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            maxLength={13}
            className="font-mono"
          />
          <Button
            onClick={() => manualCode && onScan(manualCode)}
            disabled={manualCode.length < 8}
          >
            Usar
          </Button>
        </div>
      </div>
    </div>
  );
}

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
  onUpdateOverride: (
    signature: string,
    override: Partial<VariantOverride>,
  ) => void;
  onResetOverride: (signature: string) => void;
  onResetAll: () => void;
}

const RENT_UNITS = [
  { value: "hora", label: "Hora" },
  { value: "día", label: "Día" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
  { value: "evento", label: "Evento" },
];

export function VariantsTable({
  baseSku,
  variants,
  stats,
  isSerial,
  onUpdateOverride,
  onResetOverride,
  onResetAll,
}: VariantsTableProps) {
  // Estados locales SOLO para los inputs de aplicación global
  const [globalPriceRent, setGlobalPriceRent] = useState("");
  const [globalPriceSell, setGlobalPriceSell] = useState("");
  const [globalUnit, setGlobalUnit] = useState("");
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  // Aplicar precio de renta en masa
  const applyGlobalRentPrice = useCallback(() => {
    const numValue = parseFloat(globalPriceRent);
    if (isNaN(numValue)) return;

    variants.forEach((variant) => {
      if (variant.isActive) {
        onUpdateOverride(variant.signature, { priceRent: numValue });
      }
    });
  }, [globalPriceRent, variants, onUpdateOverride]);

  // Aplicar precio de venta en masa
  const applyGlobalSellPrice = useCallback(() => {
    const numValue = parseFloat(globalPriceSell);
    if (isNaN(numValue)) return;

    variants.forEach((variant) => {
      if (variant.isActive) {
        onUpdateOverride(variant.signature, { priceSell: numValue });
      }
    });
  }, [globalPriceSell, variants, onUpdateOverride]);

  // Aplicar unidad en masa
  const applyGlobalUnit = useCallback(() => {
    if (!globalUnit) return;

    variants.forEach((variant) => {
      if (variant.isActive) {
        onUpdateOverride(variant.signature, { rentUnit: globalUnit });
      }
    });
  }, [globalUnit, variants, onUpdateOverride]);

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

  const pageCount = Math.max(1, Math.ceil(variants.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const paginatedVariants = variants.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize,
  );
  const canPreviousPage = safePageIndex > 0;
  const canNextPage = safePageIndex < pageCount - 1;

  return (
    <div className="space-y-6">
      {/* Resumen superior */}
      <Card className="bg-linear-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
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
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>
                <strong>Modo Serializado:</strong> Cada variante representa un
                ítem único. El stock se gestionará por números de serie
                individuales.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aplicar valores en masa - CADA UNO INDEPENDIENTE */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Aplicar valores masivamente (opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            {/* Precio Renta - INDEPENDIENTE */}
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

            {/* Unidad - INDEPENDIENTE */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Unidad Renta</label>
              <div className="flex gap-2">
                <select
                  className="h-8 text-sm border rounded px-2 bg-background w-32"
                  value={globalUnit}
                  onChange={(e) => setGlobalUnit(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {RENT_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
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

            {/* Precio Venta - INDEPENDIENTE */}
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
        </CardContent>
      </Card>

      {/* Tabla de variantes */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center">Activo</TableHead>
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
                      <DollarSign className="w-3 h-3" />
                      Precio Renta
                    </div>
                  </TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Precio Venta
                    </div>
                  </TableHead>
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
                  />
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex w-full items-center justify-end gap-8 lg:w-fit lg:ml-auto">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page-variant" className="text-sm font-medium">
                  Filas por pagina
                </Label>
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPageIndex(0);
                  }}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page-variant">
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
        </CardContent>
      </Card>
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
}

function VariantRow({
  variant,
  onUpdateOverride,
  onResetOverride,
  onGenerateBarcode,
  onCopyBarcode,
  copiedBarcode,
}: VariantRowProps) {
  // Estado local SOLO para este input específico
  const [localRentPrice, setLocalRentPrice] = useState(
    variant.priceRent ? String(variant.priceRent) : "",
  );
  const [localSellPrice, setLocalSellPrice] = useState(
    variant.priceSell ? String(variant.priceSell) : "",
  );
  const [localBarcode, setLocalBarcode] = useState(variant.barcode || "");

  // Actualizar estado local cuando cambia la variante externamente
  useEffect(() => {
    setLocalRentPrice(variant.priceRent ? String(variant.priceRent) : "");
    setLocalSellPrice(variant.priceSell ? String(variant.priceSell) : "");
    setLocalBarcode(variant.barcode || "");
  }, [variant.priceRent, variant.priceSell, variant.barcode]);

  const handleRentPriceChange = (value: string) => {
    setLocalRentPrice(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdateOverride(variant.signature, { priceRent: num });
    }
  };

  const handleSellPriceChange = (value: string) => {
    setLocalSellPrice(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdateOverride(variant.signature, { priceSell: num });
    }
  };

  const handleBarcodeChange = (value: string) => {
    setLocalBarcode(value);
    onUpdateOverride(variant.signature, { barcode: value });
  };

  const handleUnitChange = (value: string) => {
    onUpdateOverride(variant.signature, { rentUnit: value });
  };

  const attributeKeys = Object.keys(variant.attributes);

  return (
    <TableRow className={!variant.isActive ? "opacity-50 bg-muted/20" : ""}>
      {/* Activo */}
      <TableCell className="text-center">
        <Switch
          checked={variant.isActive}
          onCheckedChange={(checked) =>
            onUpdateOverride(variant.signature, { isActive: checked })
          }
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
            "h-8 font-mono text-xs w-32",
            variant.hasOverride && "border-blue-500 bg-blue-50/50",
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
              "h-8 font-mono text-xs w-32",
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

      {/* Precio Renta - INPUT INDEPENDIENTE */}
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={localRentPrice}
          onChange={(e) => handleRentPriceChange(e.target.value)}
          className="h-8 w-24"
          disabled={!variant.isActive}
          placeholder="0.00"
        />
      </TableCell>

      {/* Unidad - SELECT INDEPENDIENTE */}
      <TableCell>
        <select
          value={variant.rentUnit}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="h-8 text-sm border rounded px-2 bg-background w-24"
          disabled={!variant.isActive}
        >
          {RENT_UNITS.map((unit) => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
      </TableCell>

      {/* Precio Venta - INPUT INDEPENDIENTE */}
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={localSellPrice}
          onChange={(e) => handleSellPriceChange(e.target.value)}
          className="h-8 w-24"
          disabled={!variant.isActive}
          placeholder="0.00"
        />
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
}
