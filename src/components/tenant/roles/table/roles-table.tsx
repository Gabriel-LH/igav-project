// components/roles/RolesTable.tsx
"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";

import {
  Shield,
  Users,
  Edit3,
  Copy,
  Trash2,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Lock,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissionIds: string[];
  createdAt: Date;
  updatedAt: Date;
  users?: { id: string; name: string; email: string; image: string | null }[];
}

interface RolesTableProps {
  data: Role[];
  isOwner: boolean;
  onEdit: (role: Role) => void;
  onClone: (role: Role) => void;
  onDelete: (id: string) => void;
  onViewDetail: (role: Role) => void;
  onToggleActive: (id: string, active: boolean) => void;
  setEditingRole: (role: Role | null) => void;
  setIsFormOpen: (open: boolean) => void;
  isPending: boolean;
}

export function RolesTable({
  data,
  isOwner,
  onEdit,
  onClone,
  onDelete,
  onViewDetail,
  onToggleActive,
  setEditingRole,
  setIsFormOpen,
  isPending,

}: RolesTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-lg",
                role.isSystem ? "bg-purple-100" : "bg-blue-100",
              )}
            >
              <Shield
                className={cn(
                  "w-4 h-4",
                  role.isSystem ? "text-purple-600" : "text-blue-600",
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onViewDetail(role)}
                  className="font-medium hover:text-primary transition-colors text-left"
                >
                  {role.name}
                </button>
                {role.isSystem && (
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Sistema
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {role.description}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => (
        <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
          {row.getValue("description")}
        </p>
      ),
    },
    {
      accessorKey: "isSystem",
      header: "Tipo",
      cell: ({ row }) => {
        const isSystem = row.getValue("isSystem") as boolean;
        return (
          <Badge variant={isSystem ? "default" : "secondary"}>
            {isSystem ? "Sistema" : "Personalizado"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "userCount",
      header: "Usuarios",
      cell: ({ row }) => {
        const count = row.getValue("userCount") as number;
        return (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span
              className={cn(
                "font-medium",
                count > 0 ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {count}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => {
        const active = row.getValue("isActive") as boolean;
        const role = row.original;

        return (
          <button
            onClick={() => !role.isSystem && onToggleActive(role.id, !active)}
            disabled={role.isSystem}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
              active
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700",
              !role.isSystem && "cursor-pointer hover:opacity-80",
              role.isSystem && "cursor-not-allowed opacity-60",
            )}
          >
            {active ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Activo
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Inactivo
              </>
            )}
          </button>
        );
      },
    },
    {
      accessorKey: "permissionIds",
      header: "Permisos",
      cell: ({ row }) => {
        const count = (row.getValue("permissionIds") as string[]).length;
        return (
          <Badge variant="outline" className="font-mono">
            {count} permisos
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const role = row.original;

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(role);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onEdit(role)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onClone(role)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar rol
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {!role.isSystem && (
                  <DropdownMenuItem
                    onClick={() => onDelete(role.id)}
                    className="text-red-600 focus:text-red-600"
                    disabled={role.userCount > 0}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                    {role.userCount > 0 && " (tiene usuarios)"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar roles..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          onClick={() => {
            setEditingRole(null);
            setIsFormOpen(true);
          }}
          className="gap-2"
          disabled={isPending}
        >
          <Plus className="w-4 h-4" />
          Crear Rol
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="font-semibold">
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/30 transition-colors"
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
                    className="h-32 text-center text-muted-foreground"
                  >
                    No se encontraron roles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Mostrando{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          a{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            data.length,
          )}{" "}
          de {data.length} roles
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
