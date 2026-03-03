// components/catalogs/categories/CategoriesTable.tsx
"use client";

import { useState, useMemo, JSX } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
} from "lucide-react";
import {
  Category,
  CategoryFormData,
  CategoryNode,
} from "@/src/types/category/type.category";
import { CategoryForm } from "../category-form";
import { buildCategoryTree } from "@/src/utils/category/categoryTree";
import { cn } from "@/lib/utils";

interface CategoriesTableProps {
  data: Category[];
  onCreate: (data: CategoryFormData) => void;
  onUpdate: (id: string, data: CategoryFormData) => void;
  onDelete: (id: string) => void;
}

export function CategoriesTable({
  data,
  onCreate,
  onUpdate,
  onDelete,
}: CategoriesTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildCategoryTree(data), [data]);

  // Filtrar por búsqueda
  const filteredTree = useMemo(() => {
    if (!globalFilter) return tree;

    const searchTerm = globalFilter.toLowerCase();
    const filterNodes = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes
        .filter((node) => {
          const matches =
            node.name.toLowerCase().includes(searchTerm) ||
            (node.slug ?? "").toLowerCase().includes(searchTerm);
          const hasMatchingChildren = filterNodes(node.children).length > 0;
          return matches || hasMatchingChildren;
        })
        .map((node) => ({
          ...node,
          children: filterNodes(node.children),
        }));
    };

    return filterNodes(tree);
  }, [tree, globalFilter]);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  // Renderizado recursivo de filas - CORREGIDO
  const renderRows = (
    nodes: CategoryNode[],
    level: number = 0,
  ): JSX.Element[] => {
    return nodes.flatMap((node) => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedRows.has(node.id);
      const paddingLeft = level * 24;

      const row = (
        <TableRow
          key={node.id}
          className={cn(!node.isActive && "opacity-50", "hover:bg-muted/50")}
        >
          {/* Celda: Nombre y jerarquía */}
          <TableCell className="font-medium">
            <div className="flex items-center gap-2" style={{ paddingLeft }}>
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(node.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <span className="w-6 shrink-0" />
              )}

              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <Folder className="h-5 w-5 text-primary shrink-0" />
                )
              ) : (
                <span className="w-5 shrink-0 inline-block" />
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate">{node.name}</span>
                  {node.color && (
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: node.color }}
                      title={`Color: ${node.color}`}
                    />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {node.slug ?? "sin-slug"} • {node.productCount ?? 0} productos
                  {node.totalProductCount !== node.productCount && (
                    <span> (total: {node.totalProductCount ?? 0})</span>
                  )}
                </div>
              </div>
            </div>
          </TableCell>

          {/* Celda: Nivel */}
          <TableCell>
            <Badge variant={node.level === 0 ? "default" : "secondary"}>
              {node.level === 0 ? "Principal" : `Nivel ${node.level}`}
            </Badge>
          </TableCell>

          {/* Celda: POS */}
          <TableCell>
            <Switch checked={node.showInPos} disabled />
          </TableCell>

          {/* Celda: E-commerce */}
          <TableCell>
            <Switch checked={node.showInEcommerce} disabled />
          </TableCell>

          {/* Celda: Estado */}
          <TableCell>
            <Badge
              variant={node.isActive ? "default" : "destructive"}
              className={cn(
                !node.isActive && "bg-red-100 text-red-800 hover:bg-red-100",
              )}
            >
              {node.isActive ? "Activa" : "Inactiva"}
            </Badge>
          </TableCell>

          {/* Celda: Acciones */}
          <TableCell>
            <div className="flex items-center gap-1">
              <CategoryForm
                categories={data}
                initialData={node}
                onSubmit={(formData) => onUpdate(node.id, formData)}
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />

              <CategoryForm
                categories={data}
                defaultParentId={node.id}
                onSubmit={(formData) => {
                  onCreate(formData);
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Agregar subcategoría"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onDelete(node.id)}
                    disabled={node.children.length > 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {node.children.length > 0
                      ? "Tiene subcategorías"
                      : "Eliminar"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        </TableRow>
      );

      // Si tiene hijos y está expandido, renderizarlos recursivamente
      if (hasChildren && isExpanded) {
        return [row, ...renderRows(node.children, level + 1)];
      }

      return [row];
    });
  };

  const rows = renderRows(filteredTree);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorías por nombre o slug..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <CategoryForm
          categories={data}
          onSubmit={(formData) => onCreate(formData)}
        />
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Categoría</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>POS</TableHead>
              <TableHead>E-commerce</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  {globalFilter ? (
                    <div className="space-y-1">
                      <p>No se encontraron categorías.</p>
                      <p className="text-sm">Intenta con otra búsqueda.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p>No hay categorías registradas.</p>
                      <p className="text-sm">
                        Crea tu primera categoría para comenzar.
                      </p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer info */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {rows.length} categorías
            {globalFilter && ` (filtradas de ${data.length})`}
          </span>
          <span>
            {data.filter((c) => c.level === 0).length} principales,{" "}
            {data.filter((c) => c.level! > 0).length} subcategorías
          </span>
        </div>
      )}
    </div>
  );
}

