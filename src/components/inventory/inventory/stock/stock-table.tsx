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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { BarcodeDisplay } from "../barcode/BarcodeDisplay";
import {
  Barcode,
  Eye,
  Trash2,
  Copy,
  Check,
  Printer,
  Hash,
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

  return (
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
            {stockList.map((item) => (
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Ver código de barras"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Barcode className="w-5 h-5" />
                            {item.variantCode}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                          <BarcodeDisplay
                            value={item.barcode}
                            title={item.productName}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="gap-2"
                              onClick={() => copyBarcode(item.barcode)}
                            >
                              {copiedBarcode === item.barcode ? (
                                <>
                                  <Check className="w-4 h-4" /> Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" /> Copiar
                                </>
                              )}
                            </Button>
                            <Button
                              className="gap-2"
                              onClick={() => window.print()}
                            >
                              <Printer className="w-4 h-4" />
                              Imprimir
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
  );
}