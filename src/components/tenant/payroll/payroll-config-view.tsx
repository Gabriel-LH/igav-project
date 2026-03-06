// components/payroll/PayrollConfigView.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Edit, Plus, Power, MoreHorizontal, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PayrollConfigForm } from './payroll-config-form';
import type {
  PayrollConfigView,
  PayrollEmployee,
} from "@/src/types/payroll/type.payrollView";
import { CalendarIcon, ClockIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface PayrollConfigViewProps {
  configs: PayrollConfigView[];
  employees: PayrollEmployee[];
  onConfigsChange: (configs: PayrollConfigView[]) => void;
}

export function PayrollConfigView({ configs, employees, onConfigsChange }: PayrollConfigViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PayrollConfigView | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    return configs.filter(config => {
      if (typeFilter === 'all') return true;
      return config.type === typeFilter;
    });
  }, [configs, typeFilter]);

  const handleToggleStatus = (config: PayrollConfigView) => {
    const updatedConfig: PayrollConfigView = {
      ...config,
      status: config.status === 'active' ? 'inactive' : 'active',
      updatedAt: new Date(),
    };
    onConfigsChange(configs.map(c => c.id === config.id ? updatedConfig : c));
  };

  const formatSalary = (config: PayrollConfigView) => {
    if (config.type === 'mensual') {
      return `$${config.baseSalary.toLocaleString()}/mes`;
    } else {
      return `$${config.hourlyRate}/hora`;
    }
  };

  const columns: ColumnDef<PayrollConfigView>[] = [
    {
      accessorKey: 'employeeName',
      header: 'Empleado',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('employeeName')}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge variant="outline" className="capitalize">
            {type === 'mensual' ? <HugeiconsIcon icon={CalendarIcon} /> : <HugeiconsIcon icon={ClockIcon} />}
          </Badge>
        );
      },
    },
    {
      id: 'salary',
      header: 'Salario Base',
      cell: ({ row }) => formatSalary(row.original),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const config = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setEditingConfig(config)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleStatus(config)}>
                <Power className="mr-2 h-4 w-4" />
                {config.status === 'active' ? 'Desactivar' : 'Activar'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Configuración Salarial
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Configuración
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Buscar empleado..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="por_hora">Por hora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No hay configuraciones
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>

      {(showForm || editingConfig) && (
        <PayrollConfigForm
          config={editingConfig}
          employees={employees}
          onClose={() => {
            setShowForm(false);
            setEditingConfig(null);
          }}
          onSubmit={(config) => {
            if (editingConfig) {
              onConfigsChange(configs.map(c => c.id === config.id ? config : c));
            } else {
              onConfigsChange([...configs, config]);
            }
            setShowForm(false);
            setEditingConfig(null);
          }}
        />
      )}
    </>
  );
}
