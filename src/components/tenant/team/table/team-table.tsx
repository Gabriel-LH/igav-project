// components/team/TeamTable.tsx
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
  type FilterFn,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  MoreHorizontal,
  Mail,
  Building2,
  Shield,
  UserX,
  UserCheck,
  Edit3,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "admin" | "manager" | "seller" | "inventory" | "viewer";
  branchId: string;
  branchName: string;
  status: "active" | "invited" | "suspended";
  phone?: string;
  joinedAt: Date;
  lastActive?: Date;
  permissions: string[];
}

interface TeamTableProps {
  data: TeamMember[];
  branches: Array<{ id: string; name: string }>;
  onEdit: (member: TeamMember) => void;
  onSuspend: (id: string) => void;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
  onChangeRole: (id: string, role: TeamMember["role"]) => void;
  onResendInvite: (id: string) => void;
}

const ROLE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  admin: { label: "Administrador", color: "bg-purple-100 text-purple-800", icon: Shield },
  manager: { label: "Gerente", color: "bg-blue-100 text-blue-800", icon: Building2 },
  seller: { label: "Vendedor", color: "bg-green-100 text-green-800", icon: Mail },
  inventory: { label: "Inventario", color: "bg-orange-100 text-orange-800", icon: Building2 },
  viewer: { label: "Visualizador", color: "bg-gray-100 text-gray-800", icon: Mail },
};

const STATUS_CONFIG = {
  active: { label: "Activo", color: "bg-green-100 text-green-800 border-green-300", icon: UserCheck },
  invited: { label: "Invitado", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Mail },
  suspended: { label: "Suspendido", color: "bg-red-100 text-red-800 border-red-300", icon: UserX },
};

const fuzzyFilter: FilterFn<TeamMember> = (row, columnId, value) => {
  const searchValue = value.toLowerCase();
  const cellValue = String(row.getValue(columnId)).toLowerCase();
  return cellValue.includes(searchValue);
};

export function TeamTable({
  data,
  branches,
  onEdit,
  onSuspend,
  onActivate,
  onDelete,
  onChangeRole,
  onResendInvite,
}: TeamTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filteredData = data.filter((member) => {
    if (branchFilter !== "all" && member.branchId !== branchFilter) return false;
    if (statusFilter !== "all" && member.status !== statusFilter) return false;
    if (roleFilter !== "all" && member.role !== roleFilter) return false;
    return true;
  });

  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: "name",
      header: "Miembro",
      cell: ({ row }) => {
        const member = row.original;
        const StatusIcon = STATUS_CONFIG[member.status].icon;
        
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                member.status === "active" ? "bg-green-500" :
                member.status === "invited" ? "bg-yellow-500" : "bg-red-500"
              )} />
            </div>
            <div>
              <p className="font-medium text-sm">{member.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" />
                {member.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        const config = ROLE_LABELS[role];
        const Icon = config.icon;
        
        return (
          <Badge variant="outline" className={cn("gap-1", config.color)}>
            <Icon className="w-3 h-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "branchName",
      header: "Sucursal",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Building2 className="w-3 h-3 text-muted-foreground" />
          {row.getValue("branchName")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof STATUS_CONFIG;
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        
        return (
          <Badge variant="outline" className={cn("gap-1", config.color)}>
            <Icon className="w-3 h-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "joinedAt",
      header: "Ingreso",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue("joinedAt")).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const member = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => onEdit(member)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              
              {member.status === "invited" && (
                <DropdownMenuItem onClick={() => onResendInvite(member.id)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Reenviar invitación
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => onChangeRole(member.id, "admin")}
                disabled={member.role === "admin"}
              >
                <Shield className="w-4 h-4 mr-2" />
                Cambiar a Admin
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onChangeRole(member.id, "manager")}
                disabled={member.role === "manager"}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Cambiar a Gerente
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onChangeRole(member.id, "seller")}
                disabled={member.role === "seller"}
              >
                <Mail className="w-4 h-4 mr-2" />
                Cambiar a Vendedor
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {member.status === "active" ? (
                <DropdownMenuItem 
                  onClick={() => onSuspend(member.id)}
                  className="text-amber-600 focus:text-amber-600"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Suspender
                </DropdownMenuItem>
              ) : member.status === "suspended" ? (
                <DropdownMenuItem 
                  onClick={() => onActivate(member.id)}
                  className="text-green-600 focus:text-green-600"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Activar
                </DropdownMenuItem>
              ) : null}
              
              <DropdownMenuItem 
                onClick={() => onDelete(member.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
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
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-fit">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sucursal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="invited">Invitados</SelectItem>
              <SelectItem value="suspended">Suspendidos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="manager">Gerentes</SelectItem>
              <SelectItem value="seller">Vendedores</SelectItem>
              <SelectItem value="inventory">Inventario</SelectItem>
              <SelectItem value="viewer">Visualizadores</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
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
                    No se encontraron miembros del equipo.
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
          Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            filteredData.length
          )} de {filteredData.length} resultados
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
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
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