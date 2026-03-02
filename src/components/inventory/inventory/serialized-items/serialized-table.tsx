// components/inventory/SerializedItemsTable.tsx
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
import { QRCodeDisplay } from "../qr/QRCodeDisplay";
import {
  QrCode,
  Eye,
  Trash2,
  Copy,
  Check,
  Package,
  Store,
  Wrench,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SerializedItem {
  id: string;
  serialCode: string;
  productName: string;
  variantName: string;
  variantCode: string;
  branchName: string;
  condition: string;
  status: string;
  isForRent: boolean;
  isForSale: boolean;
  createdAt: Date;
}

interface SerializedItemsTableProps {
  items: SerializedItem[];
  onDelete: (id: string) => void;
}

const CONDITION_COLORS: Record<string, string> = {
  Nuevo: "bg-green-100 text-green-800 border-green-300",
  Usado: "bg-orange-100 text-orange-800 border-orange-300",
  Vintage: "bg-purple-100 text-purple-800 border-purple-300",
};

const STATUS_COLORS: Record<string, string> = {
  disponible: "bg-green-100 text-green-800",
  en_mantenimiento: "bg-orange-100 text-orange-800",
  alquilado: "bg-blue-100 text-blue-800",
  reservado: "bg-yellow-100 text-yellow-800",
  retirado: "bg-red-100 text-red-800",
};

export function SerializedItemsTable({
  items,
  onDelete,
}: SerializedItemsTableProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>
                <div className="flex items-center gap-1">
                  <QrCode className="w-3 h-3" />
                  Serial QR
                </div>
              </TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Variante</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  Sucursal
                </div>
              </TableHead>
              <TableHead>Condición</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Uso</TableHead>
              <TableHead className="w-16">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded max-w-[120px] truncate">
                      {item.serialCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyCode(item.serialCode)}
                    >
                      {copiedCode === item.serialCode ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </TableCell>
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
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(CONDITION_COLORS[item.condition])}
                  >
                    {item.condition}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn(STATUS_COLORS[item.status])}>
                    {item.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
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
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5" />
                            Código QR: {item.serialCode.slice(-8)}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                          <QRCodeDisplay
                            value={item.serialCode}
                            title={`${item.productName} - ${item.variantName}`}
                          />
                          <div className="grid grid-cols-2 gap-4 text-sm w-full">
                            <div>
                              <span className="text-muted-foreground">
                                Serial:
                              </span>
                              <p className="font-mono text-xs">
                                {item.serialCode}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Creado:
                              </span>
                              <p>{item.createdAt.toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
