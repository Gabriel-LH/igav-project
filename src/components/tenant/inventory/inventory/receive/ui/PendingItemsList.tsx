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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  totalReceived: number;
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
};

type ReceiveTableRow = ReceiveGroupRow | ReceiveSerialRow;

interface PendingItemsListProps {
  lines: ReceiveLine[];
  receivedSerialIds: Set<string>;
  receivedStockCounts: Record<string, number>;
  onToggleSerial: (serialId: string) => void;
  onReceiveStockQuantity: (stockId: string, quantity: number) => void;
  onSelectAll: () => void;
}

export const PendingItemsList: React.FC<PendingItemsListProps> = ({
  lines,
  receivedSerialIds,
  receivedStockCounts,
  onToggleSerial,
  onReceiveStockQuantity,
  onSelectAll,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});

  const groupedRows = useMemo<ReceiveGroupRow[]>(() => {
    return lines.map((line) => {
      if (line.type === "stock") {
        return {
          rowType: "group",
          itemType: "stock",
          id: line.id,
          productName: line.productName,
          variantName: line.variantName,
          variantCode: line.variantCode,
          destinationBranch: line.destinationBranch,
          totalExpected: line.quantityExpected,
          totalReceived: receivedStockCounts[line.id] ?? 0,
          image: line.image,
        };
      }

      const totalReceived = line.serialItems.filter((item) =>
        receivedSerialIds.has(item.id),
      ).length;

      return {
        rowType: "group",
        itemType: "serialized",
        id: line.id,
        productName: line.productName,
        variantName: line.variantName,
        variantCode: line.variantCode,
        destinationBranch: line.destinationBranch,
        totalExpected: line.serialItems.length,
        totalReceived,
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
        })),
      };
    });
  }, [lines, receivedSerialIds, receivedStockCounts]);

  const filteredRows = useMemo<ReceiveGroupRow[]>(() => {
    const normalized = globalFilter.trim().toLowerCase();
    if (!normalized) return groupedRows;

    return groupedRows
      .map((group) => {
        const groupText = `${group.productName} ${group.variantName} ${group.variantCode} ${group.destinationBranch}`.toLowerCase();
        if (groupText.includes(normalized)) {
          return group;
        }

        if (group.itemType !== "serialized" || !group.subRows) return null;

        const matched = group.subRows.filter((subRow) =>
          subRow.serialCode.toLowerCase().includes(normalized),
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
          if (row.original.rowType !== "group") {
            return <span className="inline-block w-6" />;
          }
          if (row.original.itemType !== "serialized") {
            return <span className="inline-block w-6" />;
          }

          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={row.getToggleExpandedHandler()}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
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
            const isReceived = receivedSerialIds.has(original.id);
            return (
              <div className="pl-8">
                <div className="font-medium flex items-center gap-2">
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {original.serialCode}
                  </code>
                  {isReceived ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-green-300 text-green-700"
                    >
                      Disponible
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      Pendiente
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {original.productName} · {original.variantName} -{" "}
                  {original.variantCode}
                </div>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-3">
              {original.image ? (
                <img
                  src={original.image}
                  alt={original.productName}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="space-y-1">
                <p className="font-medium">{original.productName}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {original.variantName} - {original.variantCode}
                </p>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] uppercase",
                    original.itemType === "serialized" && "bg-blue-50 text-blue-700",
                  )}
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
          if (row.original.rowType === "serial") {
            return <span className="text-xs text-muted-foreground">-</span>;
          }
          return <Badge variant="outline">{row.original.destinationBranch}</Badge>;
        },
      },
      {
        id: "assigned",
        header: "Asignados",
        cell: ({ row }) => {
          if (row.original.rowType === "serial") {
            const isReceived = receivedSerialIds.has(row.original.id);
            return (
              <Checkbox
                checked={isReceived}
                disabled={isReceived}
                onCheckedChange={() => {
                  if (!isReceived) {
                    onToggleSerial(row.original.id);
                  }
                }}
                aria-label="Marcar item serializado"
              />
            );
          }

          const progress =
            row.original.totalExpected > 0
              ? (row.original.totalReceived / row.original.totalExpected) * 100
              : 0;

          return (
            <div className="space-y-1 min-w-[140px]">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono font-semibold">
                  {row.original.totalReceived}
                </span>
                <span className="text-muted-foreground">
                  / {row.original.totalExpected}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
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
            const isReceived = receivedSerialIds.has(row.original.id);
            return isReceived ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">Listo</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">Pendiente</span>
              </div>
            );
          }

          if (row.original.itemType !== "stock") {
            return null;
          }

          const remaining =
            row.original.totalExpected - row.original.totalReceived;
          const inputValue = Math.min(
            Math.max(stockInputs[row.original.id] ?? 1, 1),
            Math.max(remaining, 1),
          );
          const canReceive = remaining > 0;

          return (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                min={1}
                max={remaining}
                value={inputValue}
                disabled={!canReceive}
                onChange={(event) => {
                  const nextValue = Math.max(
                    1,
                    Math.min(Number(event.target.value) || 1, remaining),
                  );
                  setStockInputs((prev) => ({
                    ...prev,
                    [row.original.id]: nextValue,
                  }));
                }}
                className="w-20 h-8"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!canReceive}
                onClick={() => {
                  onReceiveStockQuantity(row.original.id, inputValue);
                  setStockInputs((prev) => ({
                    ...prev,
                    [row.original.id]: 1,
                  }));
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canReceive}
                onClick={() => onReceiveStockQuantity(row.original.id, remaining)}
              >
                Recibir todo
              </Button>
            </div>
          );
        },
      },
    ],
    [onReceiveStockQuantity, onToggleSerial, receivedSerialIds, stockInputs],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) =>
      row.rowType === "group" && row.itemType === "serialized"
        ? row.subRows
        : undefined,
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    state: {
      sorting,
      expanded,
    },
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
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
                      row.original.rowType === "group" &&
                        row.original.itemType === "serialized" &&
                        "bg-muted/40",
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
