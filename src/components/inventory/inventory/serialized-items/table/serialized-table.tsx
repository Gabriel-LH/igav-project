"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  ExpandedState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { QRCodeDisplay } from "../../qr/QRCodeDisplay";
import {
  QrCode,
  Eye,
  Trash2,
  Copy,
  Check,
  Store,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight as ChevronExpand,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SerializedListItem } from "@/src/application/interfaces/inventory/SerializedListItem";

interface SerializedItemsTableProps {
  items: SerializedListItem[];
  onDelete: (id: string) => void;
}

type SerializedItemRow = SerializedListItem & {
  rowType: "item";
};

type SerializedGroupRow = {
  id: string;
  rowType: "group";
  productName: string;
  variantName: string;
  variantCode: string;
  total: number;
  statusCount: Record<string, number>;
  subRows: SerializedItemRow[];
  createdAt: Date;
};

type SerializedTableRow = SerializedGroupRow | SerializedItemRow;

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

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "disponible", label: "Disponible" },
  { value: "en_mantenimiento", label: "En mantenimiento" },
  { value: "alquilado", label: "Alquilado" },
  { value: "reservado", label: "Reservado" },
  { value: "retirado", label: "Retirado" },
];

export function SerializedItemsTable({
  items,
  onDelete,
}: SerializedItemsTableProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchSearch =
        normalizedSearch.length === 0 ||
        item.serialCode.toLowerCase().includes(normalizedSearch) ||
        item.productName.toLowerCase().includes(normalizedSearch) ||
        item.variantName.toLowerCase().includes(normalizedSearch) ||
        item.variantCode.toLowerCase().includes(normalizedSearch);

      return matchStatus && matchSearch;
    });
  }, [items, searchTerm, statusFilter]);

  const groupedRows = useMemo<SerializedGroupRow[]>(() => {
    const map = new Map<string, SerializedGroupRow>();

    filteredItems.forEach((item) => {
      const key = `${item.productName}::${item.variantName}::${item.variantCode}`;
      const existing = map.get(key);

      const itemRow: SerializedItemRow = { ...item, rowType: "item" };

      if (!existing) {
        map.set(key, {
          id: `group-${key}`,
          rowType: "group",
          productName: item.productName,
          variantName: item.variantName,
          variantCode: item.variantCode,
          total: 1,
          statusCount: { [item.status]: 1 },
          subRows: [itemRow],
          createdAt: item.createdAt,
        });
        return;
      }

      existing.total += 1;
      existing.statusCount[item.status] = (existing.statusCount[item.status] ?? 0) + 1;
      existing.subRows.push(itemRow);
      if (item.createdAt > existing.createdAt) {
        existing.createdAt = item.createdAt;
      }
    });

    return Array.from(map.values());
  }, [filteredItems]);

  const columns = useMemo<ColumnDef<SerializedTableRow>[]>(
    () => [
      {
        id: "expander",
        header: "",
        cell: ({ row }) => {
          const original = row.original;
          if (original.rowType !== "group") {
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
                <ChevronExpand className="h-4 w-4" />
              )}
            </Button>
          );
        },
      },
      {
        id: "productVariant",
        accessorFn: (row) => `${row.productName} ${row.variantName} ${row.variantCode}`,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Producto / Variante
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const original = row.original;

          if (original.rowType === "group") {
            return (
              <div className="space-y-1">
                <div className="font-medium">{original.productName}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {original.variantName} - {original.variantCode}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {original.total} serializados
                </Badge>
              </div>
            );
          }

          return (
            <div className="pl-8">
              <div className="font-medium">{original.productName}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {original.variantName} - {original.variantCode}
              </div>
            </div>
          );
        },
      },
      {
        id: "serial",
        accessorFn: (row) => (row.rowType === "item" ? row.serialCode : ""),
        header: () => (
          <div className="flex items-center gap-1">
            <QrCode className="w-3 h-3" />
            Serial QR
          </div>
        ),
        cell: ({ row }) => {
          const original = row.original;
          if (original.rowType === "group") {
            return <span className="text-muted-foreground text-xs">-</span>;
          }

          return (
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded max-w-[140px] truncate">
                {original.serialCode}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyCode(original.serialCode)}
              >
                {copiedCode === original.serialCode ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          );
        },
      },
      {
        id: "branch",
        accessorFn: (row) => (row.rowType === "item" ? row.branchName : ""),
        header: () => (
          <div className="flex items-center gap-1">
            <Store className="w-3 h-3" />
            Sucursal
          </div>
        ),
        cell: ({ row }) => {
          if (row.original.rowType === "group") {
            return <span className="text-muted-foreground text-xs">-</span>;
          }
          return row.original.branchName;
        },
      },
      {
        id: "condition",
        accessorFn: (row) => (row.rowType === "item" ? row.condition : ""),
        header: "Condicion",
        cell: ({ row }) => {
          if (row.original.rowType === "group") {
            return <span className="text-muted-foreground text-xs">-</span>;
          }

          const condition = row.original.condition;
          return (
            <Badge variant="outline" className={cn(CONDITION_COLORS[condition])}>
              {condition}
            </Badge>
          );
        },
      },
      {
        id: "status",
        accessorFn: (row) => (row.rowType === "item" ? row.status : ""),
        header: "Estado",
        cell: ({ row }) => {
          const original = row.original;

          if (original.rowType === "group") {
            return (
              <div className="flex flex-wrap gap-1">
                {Object.entries(original.statusCount).map(([status, count]) => (
                  <Badge key={status} className={cn(STATUS_COLORS[status])}>
                    {status.replace(/_/g, " ")}: {count}
                  </Badge>
                ))}
              </div>
            );
          }

          return (
            <Badge className={cn(STATUS_COLORS[original.status])}>
              {original.status.replace(/_/g, " ")}
            </Badge>
          );
        },
      },
      {
        id: "usage",
        header: "Uso",
        cell: ({ row }) => {
          if (row.original.rowType === "group") {
            return <span className="text-muted-foreground text-xs">-</span>;
          }

          return (
            <div className="flex gap-1 flex-wrap">
              {row.original.isForRent && (
                <Badge variant="secondary" className="text-xs">
                  Renta
                </Badge>
              )}
              {row.original.isForSale && (
                <Badge variant="secondary" className="text-xs">
                  Venta
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          if (row.original.rowType === "group") {
            return null;
          }

          const item = row.original;

          return (
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
                      Codigo QR: {item.serialCode.slice(-8)}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center gap-4 py-4">
                    <QRCodeDisplay
                      value={item.serialCode}
                      title={`${item.productName} - ${item.variantName}`}
                    />
                    <div className="grid grid-cols-2 gap-4 text-sm w-full">
                      <div>
                        <span className="text-muted-foreground">Serial:</span>
                        <p className="font-mono text-xs">{item.serialCode}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Creado:</span>
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
          );
        },
      },
    ],
    [copiedCode, onDelete],
  );

  const table = useReactTable({
    data: groupedRows,
    columns,
    state: {
      expanded,
      sorting,
    },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    getSubRows: (row) => (row.rowType === "group" ? row.subRows : undefined),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              table.setPageIndex(0);
            }}
            className="pl-9"
            placeholder="Buscar por serial, producto o variante..."
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            table.setPageIndex(0);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50">
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      row.original.rowType === "group" && "bg-muted/30 font-medium",
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
                    No se encontraron items serializados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex w-full items-center justify-end gap-8 lg:w-fit lg:ml-auto">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page-serialized" className="text-sm font-medium">
              Filas por pagina
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-20"
                id="rows-per-page-serialized"
              >
                <SelectValue placeholder={table.getState().pagination.pageSize} />
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
            Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a la primera pagina</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a la pagina anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a la pagina siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
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
