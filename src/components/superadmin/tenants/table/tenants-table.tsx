// src/components/tenants/TenantsTable.tsx
"use client";
import React, { useState } from 'react';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Edit, Ban, Repeat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tenant } from '@/src/types/tenant/type.tenant'; 
import { TenantSubscription } from '@/src/types/tenant/tenantSuscription';
import { Plan } from '@/src/types/plan/planSchema'; 
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dropdown-menu';
import { Input } from "@/components/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { assignPlan } from "@/src/app/(superadmin)/superadmin/actions/tenant.actions";
import { toast } from "sonner";
import { BillingCycle } from "@prisma/client";

interface TenantsTableProps {
  tenants: Tenant[];
  subscriptions: TenantSubscription[];
  plans: Plan[];
}

export const TenantsTable: React.FC<TenantsTableProps> = ({
  tenants,
  subscriptions,
  plans,
}) => {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener suscripción activa de un tenant
  const getTenantSubscription = (tenantId: string) => {
    return subscriptions.find(s => s.tenantId === tenantId && s.status === 'active');
  };

  // Obtener plan de un tenant
  const getTenantPlan = (tenantId: string) => {
    const subscription = getTenantSubscription(tenantId);
    if (!subscription) return null;
    return plans.find(p => p.id === subscription.planId);
  };
  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tenant
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      id: 'plan',
      header: 'Plan',
      cell: ({ row }) => {
        const plan = getTenantPlan(row.original.id);
        const subscription = getTenantSubscription(row.original.id);
        
        if (!plan) return <Badge variant="outline">Sin plan</Badge>;
        
        return (
          <div className="flex flex-col">
            <span className="font-medium">{plan.name}</span>
            {subscription && (
              <Badge variant="secondary" className="w-fit mt-1">
                {subscription.billingCycle === 'monthly' ? 'Mensual' : 'Anual'}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const variant = status === "active" ? "default" : "destructive";
        const className = status === "active" ? "bg-green-500 hover:bg-green-600 text-white" : "";
        return (
          <Badge variant={variant} className={className}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'branches',
      header: 'Branches',
      cell: () => {
        // Esto vendría de los límites/configuración del tenant
        return <div>3</div>;
      },
    },
    {
      id: 'users',
      header: 'Users',
      cell: () => {
        // Esto vendría de los límites/configuración del tenant
        return <div>8</div>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div>{row.original.createdAt.toLocaleDateString()}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const tenant = row.original;
        // getTenantPlan and getTenantSubscription are used in other columns, 
        // they are already defined in the component scope.
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/superadmin/tenants/${tenant.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-yellow-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTenantId(tenant.id);
                  const activeSubscription = getTenantSubscription(tenant.id);
                  if (activeSubscription) setSelectedPlanId(activeSubscription.planId);
                  setIsAssignDialogOpen(true);
                }}
              >
                <Repeat className="mr-2 h-4 w-4" />
                {tenant.currentSubscriptionId ? 'Cambiar plan' : 'Asignar plan'}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Ban className="mr-2 h-4 w-4" />
                Suspender
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: tenants,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filtrar tenants..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

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
                          header.getContext()
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
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/superadmin/tenants/${row.original.id}`)}
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
                  No hay tenants.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Plan</DialogTitle>
            <DialogDescription>
              Selecciona un plan y el ciclo de facturación para el tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - S/ {Number(plan.priceMonthly).toFixed(2)} / mes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ciclo de Facturación</label>
              <Select 
                value={billingCycle} 
                onValueChange={(val) => setBillingCycle(val as BillingCycle)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona ciclo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                if (!selectedTenantId || !selectedPlanId) return;
                setIsSubmitting(true);
                try {
                  await assignPlan(selectedTenantId, selectedPlanId, billingCycle as BillingCycle);
                  toast.success("Plan asignado correctamente");
                  setIsAssignDialogOpen(false);
                } catch (error) {
                  toast.error("Error al asignar plan");
                  console.error(error);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting || !selectedPlanId}
            >
              {isSubmitting ? "Asignando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
