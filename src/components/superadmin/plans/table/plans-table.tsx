// src/components/plans/PlansTable.tsx
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
  Edit,
  Copy,
  Power,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { CreatePlanModal } from "../ui/modal/CreatePlanModal";
import { EditPlanModal } from "../ui/modal/EditPlanModal";
import { DuplicatePlanModal } from "../ui/modal/DuplicatePlanModal";
import { ChangePlanStatusModal } from "../ui/modal/ChangeStatusModal";

interface PlansTableProps {
  plans: Plan[];
  onSelectPlan: (plan: Plan) => void;
  onPlanUpdate?: () => void;
}

export const PlansTable: React.FC<PlansTableProps> = ({
  plans,
  onSelectPlan,
  onPlanUpdate,
}) => {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Estados para modales
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [modalState, setModalState] = useState<{
    create: boolean;
    edit: boolean;
    duplicate: boolean;
    changeStatus: boolean;
  }>({
    create: false,
    edit: false,
    duplicate: false,
    changeStatus: false,
  });

  const columns: ColumnDef<Plan>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "priceMonthly",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price Monthly
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>S/ {row.original.priceMonthly}</div>,
    },
    {
      accessorKey: "priceYearly",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price Yearly
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>S/ {row.original.priceYearly}</div>,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? "success" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const plan = row.original;

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
              <DropdownMenuItem
                onClick={() => router.push(`/superadmin/plans/${plan.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPlan(plan);
                  setModalState({ ...modalState, edit: true });
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPlan(plan);
                  setModalState({ ...modalState, duplicate: true });
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPlan(plan);
                  setModalState({ ...modalState, changeStatus: true });
                }}
                className={plan.isActive ? "text-red-600" : "text-green-600"}
              >
                <Power className="mr-2 h-4 w-4" />
                {plan.isActive ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: plans,
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
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Input
            placeholder="Filtrar planes..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
          <Button
            onClick={() => setModalState({ ...modalState, create: true })}
          >
            Crear Plan
          </Button>
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
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectPlan(row.original)}
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
                    No hay planes.
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

      {/* Modales */}
      <CreatePlanModal
        open={modalState.create}
        onOpenChange={(open) => setModalState({ ...modalState, create: open })}
        onSuccess={onPlanUpdate}
      />

      <EditPlanModal
        open={modalState.edit}
        onOpenChange={(open) => setModalState({ ...modalState, edit: open })}
        plan={selectedPlan}
        onSuccess={onPlanUpdate}
      />

      <DuplicatePlanModal
        open={modalState.duplicate}
        onOpenChange={(open) =>
          setModalState({ ...modalState, duplicate: open })
        }
        plan={selectedPlan}
        onSuccess={onPlanUpdate}
      />

      <ChangePlanStatusModal
        open={modalState.changeStatus}
        onOpenChange={(open) =>
          setModalState({ ...modalState, changeStatus: open })
        }
        plan={selectedPlan}
        onSuccess={onPlanUpdate}
      />
    </>
  );
};
