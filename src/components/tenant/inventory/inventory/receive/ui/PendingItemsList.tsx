// src/components/inventory/assignment/PendingItemsList.tsx
import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/table';
import { Package, AlertTriangle, CheckCircle, Search } from 'lucide-react';

interface PendingItem {
  id: string;
  code: string;
  name: string;
  size?: string;
  color?: string;
  destinationBranch: string;
  status: 'pending' | 'scanned' | 'error';
  image?: string;
}

interface PendingItemsListProps {
  items: PendingItem[];
  scannedItems: Set<string>;
  onItemSelect: (itemId: string) => void;
  onSelectAll: () => void;
}

export const PendingItemsList: React.FC<PendingItemsListProps> = ({
  items,
  scannedItems,
  onItemSelect,
  onSelectAll,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const allSelected = items.length > 0 && items.every(item => scannedItems.has(item.id));

  const columns: ColumnDef<PendingItem>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={scannedItems.has(row.original.id)}
          onCheckedChange={() => onItemSelect(row.original.id)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.code}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Producto',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          {row.original.image ? (
            <img src={row.original.image} alt={row.original.name} className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              Talla: {row.original.size} | Color: {row.original.color}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'destinationBranch',
      header: 'Sucursal Destino',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.destinationBranch}</Badge>
      ),
    },
    {
      id: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const isScanned = scannedItems.has(row.original.id);
        if (isScanned) {
          return (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Asignado</span>
            </div>
          );
        }
        return (
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-600">Pendiente</span>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Productos por Recibir</span>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
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
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                    className={scannedItems.has(row.original.id) ? 'bg-green-50/50' : ''}
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