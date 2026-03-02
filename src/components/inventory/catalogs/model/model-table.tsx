// components/catalogs/models/ModelsTable.tsx
"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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
} from "@/components/table";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
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
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { Model, ModelFormData } from "@/src/types/model/type.model";
import { Brand } from "@/src/types/brand/type.brand";
import { ModelForm } from "./model-form";

interface ModelsTableProps {
  data: Model[];
  brands: Brand[]; // Para mostrar nombres de marca y filtros
  onUpdate: (id: string, data: ModelFormData) => void;
  onDelete: (id: string) => void;
}

export function ModelsTable({
  data,
  brands,
  onUpdate,
  onDelete,
}: ModelsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");

  // Filtro combinado
  const filteredData = useMemo(() => {
    return data.filter((model) => {
      const matchesBrand =
        brandFilter === "all" || model.brandId === brandFilter;
      const matchesSearch =
        !globalFilter ||
        model.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        model.slug.toLowerCase().includes(globalFilter.toLowerCase());
      return matchesBrand && matchesSearch;
    });
  }, [data, brandFilter, globalFilter]);

  // Helper para obtener nombre de marca
  const getBrandName = (brandId: string) => {
    return brands.find((b) => b.id === brandId)?.name || "Desconocida";
  };

  const columns: ColumnDef<Model>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Modelo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const model = row.original;
        return (
          <div>
            <div className="font-medium">{model.name}</div>
            <div className="text-xs text-muted-foreground font-mono">
              {model.slug}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "brandId",
      header: "Marca",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-medium">
          {getBrandName(row.getValue("brandId"))}
        </Badge>
      ),
    },
    {
      accessorKey: "year",
      header: "Año",
      cell: ({ row }) => {
        const year = row.getValue("year");
        return year ? (
          <span>{year}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-muted-foreground">
          {row.getValue("description") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
          {row.getValue("isActive") ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const model = row.original;
        return (
          <div className="flex items-center gap-2">
            <ModelForm
              brands={brands}
              initialData={model}
              onSubmit={(data) => onUpdate(model.id, data)}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
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
                  onClick={() => onDelete(model.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Header con filtros */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar modelos..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por marca..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {brands
                .filter((b) => b.isActive)
                .map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <ModelForm
          brands={brands}
          onSubmit={(data) => {
            console.log("Nuevo modelo:", data);
            onUpdate("new", data);
          }}
        />
      </div>

      {/* Tabla */}
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron modelos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
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
          Siguiente
        </Button>
      </div>
    </div>
  );
}
