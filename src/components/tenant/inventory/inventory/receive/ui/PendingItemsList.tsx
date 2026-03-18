// src/components/inventory/assignment/PendingItemsList.tsx
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ExpandedState,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Upload,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ReceiveStockLine {
  id: string;
  type: "stock";
  productName: string;
  variantName: string;
  variantCode: string;
  destinationBranch: string;
  quantityExpected: number;
  image?: string;
}

interface ReceiveSerializedLine {
  id: string;
  type: "serialized";
  productName: string;
  variantName: string;
  variantCode: string;
  destinationBranch: string;
  serialItems: Array<{
    id: string;
    serialCode: string;
  }>;
  image?: string;
}

type ReceiveLine = ReceiveStockLine | ReceiveSerializedLine;

type ReceiveGroupRow = {
  rowType: "group";
  itemType: "stock" | "serialized";
  id: string;
  productName: string;
  variantName: string;
  variantCode: string;
  destinationBranch: string;
  totalExpected: number;
  totalReceived: number;       // combined (local + committed)
  localCount: number;          // staged but not yet confirmed
  committedCount: number;      // already on server
  image?: string;
  subRows?: ReceiveSerialRow[];
};

type ReceiveSerialRow = {
  rowType: "serial";
  id: string;
  parentId: string;
  serialCode: string;
  productName: string;
  variantName: string;
  variantCode: string;
  destinationBranch: string;
  isLocal: boolean;       // scanned but not committed
  isCommitted: boolean;   // confirmed to server
};

type ReceiveTableRow = ReceiveGroupRow | ReceiveSerialRow;

interface PendingItemsListProps {
  lines: ReceiveLine[];
  receivedSerialIds: Set<string>;         // combined
  receivedStockCounts: Record<string, number>; // combined
  localStockCounts: Record<string, number>;    // staged only
  localSerialIds: Set<string>;                 // staged only
  onToggleSerial: (serialId: string) => void;
  onReceiveStockQuantity: (stockId: string, quantity: number) => void;
  onSetLocalStock: (stockId: string, quantity: number) => void;
  onSelectAll: () => void;
  onCommitLine: (lineId: string) => void;
  activeBatchId: string | null;
  onClearBatchId: () => void;
  isCommitting: boolean;
}

export const PendingItemsList: React.FC<PendingItemsListProps> = ({
  lines,
  receivedSerialIds,
  receivedStockCounts,
  localStockCounts,
  localSerialIds,
  onToggleSerial,
  onReceiveStockQuantity,
  onSetLocalStock,
  onSelectAll,
  onCommitLine,
  activeBatchId,
  onClearBatchId,
  isCommitting,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  React.useEffect(() => {
    if (activeBatchId) {
      const element = document.getElementById(`input-qty-${activeBatchId}`);
      if (element) {
        (element as HTMLInputElement).focus();
        (element as HTMLInputElement).select();
      }
    }
  }, [activeBatchId]);

  const groupedRows = useMemo<ReceiveGroupRow[]>(() => {
    return lines.map((line) => {
      if (line.type === "stock") {
        const committedCount = Math.max((receivedStockCounts[line.id] ?? 0) - (localStockCounts[line.id] ?? 0), 0);
        const local = localStockCounts[line.id] ?? 0;
        const total = committedCount + local;
        return {
          rowType: "group",
          itemType: "stock",
          id: line.id,
          productName: line.productName,
          variantName: line.variantName,
          variantCode: line.variantCode,
          destinationBranch: line.destinationBranch,
          // Denominator = what's still pending on server + what's already been confirmed
          // This keeps 20 stable in 5/20 even before and after staging
          totalExpected: line.quantityExpected + committedCount,
          totalReceived: total,
          localCount: local,
          committedCount,
          image: line.image,
        };
      }

      const totalSerialized = line.serialItems.length;
      const local = line.serialItems.filter((s) => localSerialIds.has(s.id)).length;
      const committed = line.serialItems.filter((s) => receivedSerialIds.has(s.id) && !localSerialIds.has(s.id)).length;

      return {
        rowType: "group",
        itemType: "serialized",
        id: line.id,
        productName: line.productName,
        variantName: line.variantName,
        variantCode: line.variantCode,
        destinationBranch: line.destinationBranch,
        totalExpected: totalSerialized,
        totalReceived: local + committed,
        localCount: local,
        committedCount: committed,
        image: line.image,
        subRows: line.serialItems.map((serial) => ({
          rowType: "serial",
          id: serial.id,
          parentId: line.id,
          serialCode: serial.serialCode,
          productName: line.productName,
          variantName: line.variantName,
          variantCode: line.variantCode,
          destinationBranch: line.destinationBranch,
          isLocal: localSerialIds.has(serial.id),
          isCommitted: receivedSerialIds.has(serial.id) && !localSerialIds.has(serial.id),
        })),
      };
    });
  }, [lines, receivedSerialIds, receivedStockCounts, localStockCounts, localSerialIds]);

  const filteredRows = useMemo<ReceiveGroupRow[]>(() => {
    const normalized = globalFilter.trim().toLowerCase();
    if (!normalized) return groupedRows;
    return groupedRows
      .map((group) => {
        const groupText =
          `${group.productName} ${group.variantName} ${group.variantCode} ${group.destinationBranch}`.toLowerCase();
        if (groupText.includes(normalized)) return group;
        if (group.itemType !== "serialized" || !group.subRows) return null;
        const matched = group.subRows.filter((r) =>
          r.serialCode.toLowerCase().includes(normalized),
        );
        if (matched.length === 0) return null;
        return { ...group, subRows: matched };
      })
      .filter((item): item is ReceiveGroupRow => item !== null);
  }, [groupedRows, globalFilter]);

  const columns = useMemo<ColumnDef<ReceiveTableRow>[]>(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => {
          if (row.original.rowType !== "group" || row.original.itemType !== "serialized") {
            return <span className="inline-block w-6" />;
          }
          return (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={row.getToggleExpandedHandler()}>
              {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          );
        },
      },
      {
        id: "productVariant",
        header: "Producto / Variante",
        cell: ({ row }) => {
          const original = row.original;
          if (original.rowType === "serial") {
            return (
              <div className="pl-8">
                <div className="font-medium flex items-center gap-2">
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{original.serialCode}</code>
                  {original.isCommitted ? (
                    <Badge variant="outline" className="text-[10px] border-green-300 text-green-700">✓ Confirmado</Badge>
                  ) : original.isLocal ? (
                    <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700">⏳ Por confirmar</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Pendiente</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{original.productName} · {original.variantName}</div>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-3">
              {original.image ? (
                <Image src={original.image} alt={original.productName} width={40} height={40} className="rounded object-cover" />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="space-y-1">
                <p className="font-medium">{original.productName}</p>
                <p className="text-xs text-muted-foreground font-mono">{original.variantName} - {original.variantCode}</p>
                <Badge
                  variant="secondary"
                  className={cn("text-[10px] uppercase", original.itemType === "serialized" && "bg-blue-50 text-blue-700")}
                >
                  {original.itemType === "serialized" ? "Serializado" : "Stock"}
                </Badge>
              </div>
            </div>
          );
        },
      },
      {
        id: "destinationBranch",
        header: "Sucursal Destino",
        cell: ({ row }) => {
          if (row.original.rowType === "serial") return <span className="text-xs text-muted-foreground">-</span>;
          return <Badge variant="outline">{row.original.destinationBranch}</Badge>;
        },
      },
      {
        id: "assigned",
        header: "Progreso",
        cell: ({ row }) => {
          if (row.original.rowType === "serial") {
            const o = row.original;
            return (
              <Checkbox
                checked={o.isCommitted || o.isLocal}
                disabled={o.isCommitted}
                onCheckedChange={() => { if (!o.isCommitted && !o.isLocal) onToggleSerial(o.id); }}
                aria-label="Marcar serializado"
              />
            );
          }

          const { totalExpected, totalReceived, localCount, committedCount } = row.original;
          const progress = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;
          const isComplete = totalReceived >= totalExpected && totalExpected > 0;

          return (
            <div className="space-y-1 min-w-[160px]">
              <div className="flex items-center gap-2 text-sm">
                <span className={cn("font-mono font-semibold", isComplete && "text-green-600")}>{totalReceived}</span>
                <span className="text-muted-foreground">/ {totalExpected}</span>
                {localCount > 0 && (
                  <span className="text-[11px] text-amber-600 font-medium">({committedCount}✓ + {localCount}<Loader className="inline mb-0.5" strokeWidth={3} size={12}/>)</span>
                )}
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                {/* Committed portion (solid green) */}
                <div className="h-full flex">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${totalExpected > 0 ? (committedCount / totalExpected) * 100 : 0}%` }}
                  />
                  {/* Local/staged portion (amber) */}
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{ width: `${totalExpected > 0 ? (localCount / totalExpected) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          if (row.original.rowType === "serial") {
            const o = row.original;
            if (o.isCommitted) return <div className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /><span className="text-xs">Confirmado</span></div>;
            if (o.isLocal) return <div className="flex items-center gap-1 text-amber-600"><AlertTriangle className="h-4 w-4" /><span className="text-xs">Por confirmar</span></div>;
            return <div className="flex items-center gap-1 text-orange-600"><AlertTriangle className="h-4 w-4" /><span className="text-xs">Pendiente</span></div>;
          }

          if (row.original.itemType !== "stock") return null;

          const { id, localCount, committedCount, totalExpected, totalReceived } = row.original;
          const remaining = totalExpected - totalReceived;
          const isFullyDone = remaining <= 0 && localCount === 0;
          const hasLocal = localCount > 0;
          // Max the user can set: total expected minus what's already committed to server
          const maxInput = totalExpected - committedCount;

          return (
            <div className="flex flex-wrap items-center gap-2">
              {/* Inline qty override input — shows staged count, editable for manual correction */}
              {!isFullyDone && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={maxInput}
                    value={localCount}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(Number(e.target.value) || 0, maxInput));
                      onSetLocalStock(id!, val);
                    }}
                    className={cn(
                      "w-16 h-8 text-center font-mono text-sm",
                      hasLocal && "ring-2 ring-amber-400 border-amber-400",
                      activeBatchId === id && "ring-2 ring-primary border-primary",
                    )}
                    title={`Staged: ${localCount} / Máx: ${maxInput}`}
                  />
                  <span className="text-xs text-muted-foreground">/ {maxInput}</span>
                </div>
              )}
              {/* Quick fill button when nothing staged yet */}
              {!isFullyDone && !hasLocal && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onReceiveStockQuantity(id!, remaining)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Todo
                </Button>
              )}
              {isFullyDone && (
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle className="h-4 w-4" />Completo
                </div>
              )}
              {/* Confirm button — visible when items are staged */}
              {hasLocal && (
                <Button
                  size="sm"
                  disabled={isCommitting}
                  className="h-8 bg-green-600 hover:bg-green-700 text-white gap-1"
                  onClick={() => onCommitLine(id!)}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Confirmar ({localCount})
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onReceiveStockQuantity, onSetLocalStock, onToggleSerial, onCommitLine, activeBatchId, onClearBatchId, isCommitting],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) =>
      row.rowType === "group" && row.itemType === "serialized" ? row.subRows : undefined,
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    state: { sorting, expanded },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Productos por Recibir</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onSelectAll}>
              Marcar todo
            </Button>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-green-500 inline-block" />Confirmado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-amber-400 inline-block" />Escaneado (sin confirmar)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-muted inline-block" />Pendiente
          </span>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      row.original.rowType === "group" && row.original.itemType === "serialized" && "bg-muted/40",
                      row.original.rowType === "group" && activeBatchId === row.original.id && "bg-primary/5 border-l-4 border-l-primary",
                      // Highlight rows with staged (uncommitted) items
                      row.original.rowType === "group" && row.original.localCount > 0 && activeBatchId !== row.original.id && "border-l-4 border-l-amber-400",
                      // Green tint for fully complete rows
                      row.original.rowType === "group" && row.original.totalReceived >= row.original.totalExpected && row.original.totalExpected > 0 && "",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No hay productos pendientes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
