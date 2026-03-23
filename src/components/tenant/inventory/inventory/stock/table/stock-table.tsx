// components/inventory/StockTable.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { BatchBarcodeModal } from "../../barcode/BatchBarcodeModal";
import {
  Barcode,
  Eye,
  Trash2,

  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { StockListItem } from "@/src/application/interfaces/stock/StockListItem";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "disponible", label: "Disponible", color: "green" },
  { value: "bajo_pedido", label: "Bajo Pedido", color: "orange" },
  { value: "discontinuado", label: "Discontinuado", color: "red" },
];

interface StockTableProps {
  stockList: StockListItem[];
  onDelete: (id: string) => void;
}

export function StockTable({ stockList, onDelete }: StockTableProps) {
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedBarcodeItem, setSelectedBarcodeItem] = useState<StockListItem | null>(null);

  const copyBarcode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBarcode(code);
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    const colors: Record<string, string> = {
      green: "bg-green-100 text-green-800 border-green-300",
      orange: "bg-orange-100 text-orange-800 border-orange-300",
      red: "bg-red-100 text-red-800 border-red-300",
    };
    return (
      <Badge className={cn("border", colors[option?.color || "green"])}>
        {option?.label || status}
      </Badge>
    );
  };

  if (stockList.length === 0) {
    return null;
  }

  const pageCount = Math.max(1, Math.ceil(stockList.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const paginatedStock = stockList.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize,
  );
  const canPreviousPage = safePageIndex > 0;
  const canNextPage = safePageIndex < pageCount - 1;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Producto</TableHead>
              <TableHead>Variante</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Uso</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Lote
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Barcode className="w-3 h-3" />
                  Código de Barras
                </div>
              </TableHead>
              <TableHead className="w-16">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStock.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.productName}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{item.variantName}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {item.variantCode}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{item.branchName}</TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {item.quantity}
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {item.isForRent && (
                      <Badge variant="secondary" className="text-xs">
                        Renta
                      </Badge>
                    )}
                    {item.isForSale && (
                      <Badge variant="secondary" className="text-xs">
                        Venta
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {item.lotNumber ? (
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {item.lotNumber}
                    </code>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {item.barcode}
                    </code>

                    {/* Ver/Imprimir Barcode */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Ver código de barras"
                      onClick={() => setSelectedBarcodeItem(item)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex w-full items-center justify-end gap-8 lg:w-fit lg:ml-auto">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page-stock" className="text-sm font-medium">
              Filas por pagina
            </Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPageIndex(0);
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page-stock">
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
              onClick={() => setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))}
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

      {selectedBarcodeItem && (
        <BatchBarcodeModal
          isOpen={!!selectedBarcodeItem}
          onClose={() => setSelectedBarcodeItem(null)}
          barcode={selectedBarcodeItem.barcode}
          productName={selectedBarcodeItem.productName}
          variantCode={selectedBarcodeItem.variantCode}
          variantName={selectedBarcodeItem.variantName}
          branchName={selectedBarcodeItem.branchName}
          quantity={selectedBarcodeItem.quantity}
        />
      )}
    </div>
  );
}


