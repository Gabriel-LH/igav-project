// components/branches/BranchesTable.tsx
"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Eye,
  Power,
  Settings,
  Filter,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBranchAction, updateBranchAction, toggleBranchStatusAction } from "@/src/app/(tenant)/tenant/actions/branch.actions";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/badge";
import { BranchForm } from "../branch-form";
import type { Branch } from "@/src/types/branch/type.branch";

interface BranchesTableProps {
  branches: Branch[];
  onSelectBranch: (branch: Branch) => void;
  onBranchesChange: (branches: Branch[]) => void;
}

export function BranchesTable({
  branches,
  onSelectBranch,
  onBranchesChange,
}: BranchesTableProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return branches;
    return branches.filter((branch) => branch.status === statusFilter);
  }, [branches, statusFilter]);

  const handleCreateBranch = async (newBranchData: Partial<Branch>) => {
    setIsProcessing(true);
    const res = await createBranchAction(newBranchData);
    if (res.success) {
      onBranchesChange([...branches, res.data as Branch]);
      setShowCreateForm(false);
      toast.success("Sucursal creada correctamente");
    } else {
      toast.error(res.error || "Error al crear sucursal");
    }
    setIsProcessing(false);
  };

  const handleUpdateBranch = async (updatedBranchData: Partial<Branch>) => {
    if (!editingBranch) return;
    setIsProcessing(true);
    const res = await updateBranchAction(editingBranch.id, updatedBranchData);
    if (res.success) {
      onBranchesChange(
        branches.map((b) => (b.id === editingBranch.id ? res.data as Branch : b)),
      );
      setEditingBranch(null);
      toast.success("Sucursal actualizada correctamente");
    } else {
      toast.error(res.error || "Error al actualizar sucursal");
    }
    setIsProcessing(false);
  };

  const handleToggleStatus = async (branch: Branch) => {
    setIsProcessing(true);
    const res = await toggleBranchStatusAction(branch.id, branch.status);
    if (res.success) {
      onBranchesChange(
        branches.map((b) => (b.id === branch.id ? res.data as Branch : b)),
      );
      toast.success("Estado actualizado");
    } else {
      toast.error(res.error || "Error al cambiar estado");
    }
    setIsProcessing(false);
  };

  const columns: ColumnDef<Branch>[] = [
    {
      accessorKey: "code",
      header: "Código",
      cell: ({ row }) => (
        <div className="font-mono text-sm font-medium">
          {row.getValue("code")}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.getValue("name")}</span>
          {row.original.isPrimary && (
            <Badge
              variant="default"
              className="gap-1 bg-amber-500 hover:bg-amber-600"
            >
              <Star className="h-3 w-3" />
              Principal
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: "Ciudad",
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ row }) => row.getValue("phone") || "—",
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? "Activo" : "Inactivo"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setEditingBranch(branch)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelectBranch(branch)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelectBranch(branch)}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleStatus(branch)}>
                <Power className="mr-2 h-4 w-4" />
                {branch.status === "active" ? "Desactivar" : "Activar"}
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
      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, nombre o ciudad..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 max-w-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva sucursal
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    No hay sucursales
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
      </div>

      {(showCreateForm || editingBranch) && (
        <BranchForm
          branch={editingBranch}
          allBranches={branches}
          onClose={() => {
            setShowCreateForm(false);
            setEditingBranch(null);
          }}
          onSubmit={editingBranch ? handleUpdateBranch : handleCreateBranch}
          isSubmitting={isProcessing}
        />
      )}
    </>
  );
}
