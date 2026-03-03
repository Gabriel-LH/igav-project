// components/inventory/transfer/TransfersTable.tsx
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRightLeft,
  Package,
  Store,
  Calendar,
  Truck,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  QrCode,
  Barcode,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Transfer {
  id: string;
  referenceNumber: string;
  fromBranchName: string;
  toBranchName: string;
  fromBranchAddress: string;
  toBranchAddress: string;
  status: "pendiente" | "en_transito" | "completada" | "cancelada";
  priority: "baja" | "normal" | "alta" | "urgente";
  scheduledDate: string;
  createdAt: Date;
  items: Array<{
    id: string;
    productName: string;
    variantName: string;
    isSerial: boolean;
    serialCode?: string;
    quantity: number;
    condition: string;
  }>;
  totalItems: number;
  serialCount: number;
  notes?: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

interface TransfersTableProps {
  transfers: Transfer[];
  onApprove?: (id: string) => void;
  onCancel?: (id: string) => void;
  onView?: (id: string) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pendiente: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  en_transito: {
    label: "En TrÃ¡nsito",
    color: "bg-blue-100 text-blue-800",
    icon: Truck,
  },
  completada: {
    label: "Completada",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  },
  cancelada: {
    label: "Cancelada",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

const PRIORITY_COLORS = {
  baja: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700 border-red-300",
};

export function TransfersTable({
  transfers,
  onApprove,
  onCancel,
}: TransfersTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  if (transfers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12 text-muted-foreground">
          <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay transferencias registradas</p>
        </CardContent>
      </Card>
    );
  }

  const pageCount = Math.max(1, Math.ceil(transfers.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const paginatedTransfers = transfers.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize,
  );
  const canPreviousPage = safePageIndex > 0;
  const canNextPage = safePageIndex < pageCount - 1;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Historial de Transferencias ({transfers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Referencia</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-16">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransfers.map((transfer) => {
                  const StatusIcon = STATUS_CONFIG[transfer.status].icon;

                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <code className="font-mono text-sm font-medium">
                            {transfer.referenceNumber}
                          </code>
                          <span className="text-xs text-muted-foreground">
                            {new Date(transfer.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1 text-blue-700">
                            <Store className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">
                              {transfer.fromBranchName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-green-700">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">
                              {transfer.toBranchName}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Package className="w-3 h-3" />
                            <span className="font-medium">
                              {transfer.totalItems}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              total
                            </span>
                          </div>
                          {transfer.serialCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-xs w-fit"
                            >
                              <QrCode className="w-3 h-3 mr-1" />
                              {transfer.serialCount} serializados
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {new Date(
                            transfer.scheduledDate,
                          ).toLocaleDateString()}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={cn(PRIORITY_COLORS[transfer.priority])}
                        >
                          {transfer.priority}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(STATUS_CONFIG[transfer.status].color)}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {STATUS_CONFIG[transfer.status].label}
                          </Badge>
                          {transfer.requiresApproval &&
                            !transfer.approvedBy && (
                              <Badge variant="outline" className="text-xs">
                                Por aprobar
                              </Badge>
                            )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <ArrowRightLeft className="w-5 h-5" />
                                Transferencia {transfer.referenceNumber}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                              {/* Info general */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Origen
                                  </p>
                                  <p className="font-medium">
                                    {transfer.fromBranchName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {transfer.fromBranchAddress}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Destino
                                  </p>
                                  <p className="font-medium">
                                    {transfer.toBranchName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {transfer.toBranchAddress}
                                  </p>
                                </div>
                              </div>

                              {/* Items */}
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  Items Transferidos ({transfer.items.length})
                                </h4>
                                <ScrollArea className="h-64">
                                  <div className="space-y-2">
                                    {transfer.items.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                      >
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm">
                                              {item.productName}
                                            </p>
                                            <Badge
                                              variant={
                                                item.isSerial
                                                  ? "default"
                                                  : "secondary"
                                              }
                                              className="text-xs"
                                            >
                                              {item.isSerial ? (
                                                <QrCode className="w-3 h-3 mr-1" />
                                              ) : (
                                                <Barcode className="w-3 h-3 mr-1" />
                                              )}
                                              {item.isSerial
                                                ? "Serial"
                                                : "Lote"}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            {item.variantName}
                                          </p>
                                          {item.isSerial && (
                                            <code className="text-xs font-mono text-muted-foreground">
                                              {item.serialCode}
                                            </code>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium">
                                            {item.quantity}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {item.condition}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>

                              {/* Notas */}
                              {transfer.notes && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-xs text-yellow-800 font-medium mb-1">
                                    Notas:
                                  </p>
                                  <p className="text-sm text-yellow-700">
                                    {transfer.notes}
                                  </p>
                                </div>
                              )}

                              {/* Acciones */}
                              <div className="flex justify-end gap-2">
                                {transfer.status === "pendiente" &&
                                  transfer.requiresApproval &&
                                  !transfer.approvedBy &&
                                  onApprove && (
                                    <Button
                                      onClick={() => onApprove(transfer.id)}
                                      className="gap-2"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      Aprobar Transferencia
                                    </Button>
                                  )}
                                {transfer.status === "pendiente" &&
                                  onCancel && (
                                    <Button
                                      variant="destructive"
                                      onClick={() => onCancel(transfer.id)}
                                      className="gap-2"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Cancelar
                                    </Button>
                                  )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex w-full items-center justify-end gap-8 lg:w-fit lg:ml-auto">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page-transfer" className="text-sm font-medium">
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
                id="rows-per-page-transfer"
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


