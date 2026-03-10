// src/components/billing/subscriptions/SubscriptionsTable.tsx
import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
  Calendar,
  Repeat,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TenantSubscription } from "@/src/types/tenant/tenantSuscription";
import { Tenant } from "@/src/types/tenant/type.tenant";
import { Plan } from "@/src/types/plan/planSchema";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { Input } from "@/components/ui/input";

interface SubscriptionsTableProps {
  subscriptions: TenantSubscription[];
  tenants: Tenant[];
  plans: Plan[];
  onSelectSubscription: (subscription: TenantSubscription) => void;
  onChangePlan: (subscription: TenantSubscription) => void;
}

export const SubscriptionsTable: React.FC<SubscriptionsTableProps> = ({
  subscriptions,
  tenants,
  plans,
  onSelectSubscription,
  onChangePlan,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant?.name || "Desconocido";
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    return plan?.name || "Desconocido";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "outline",
      past_due: "destructive",
      canceled: "secondary",
    };

    const colors: Record<string, string> = {
      active: "bg-green-500 hover:bg-green-600 text-white",
      trial: "border-orange-500 text-orange-500",
    };

    return (
      <Badge
        variant={variants[status] || "secondary"}
        className={colors[status] || ""}
      >
        {status}
      </Badge>
    );
  };

  const formatPeriod = (start: Date, end: Date) => {
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const columns: ColumnDef<TenantSubscription>[] = [
    {
      id: "tenant",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Tenant
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {getTenantName(row.original.tenantId)}
        </div>
      ),
    },
    {
      id: "plan",
      header: "Plan",
      cell: ({ row }) => <div>{getPlanName(row.original.planId)}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "billingCycle",
      header: "Billing Cycle",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.billingCycle}
        </Badge>
      ),
    },
    {
      id: "currentPeriod",
      header: "Current Period",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatPeriod(
            row.original.currentPeriodStart,
            row.original.currentPeriodEnd,
          )}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const subscription = row.original;
        return (
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onSelectSubscription(subscription)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangePlan(subscription);
                }}
              >
                <Repeat className="mr-2 h-4 w-4" />
                Cambiar plan
              </DropdownMenuItem>
              <DropdownMenuItem className="text-green-600">
                <Calendar className="mr-2 h-4 w-4" />
                Extender
              </DropdownMenuItem>
              {subscription.status !== "canceled" && (
                <DropdownMenuItem className="text-red-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: subscriptions,
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
          placeholder="Filtrar suscripciones..."
          value={globalFilter ?? ""}
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
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectSubscription(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay suscripciones.
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
    </div>
  );
};
