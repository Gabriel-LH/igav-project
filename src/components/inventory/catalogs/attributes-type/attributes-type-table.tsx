// components/catalogs/attribute-types/AttributeTypesTable.tsx
"use client";

import { useState } from "react";
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
} from "@/components/ui/table";
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
import { MoreHorizontal, Pencil, Trash2, Search, ArrowUpDown } from "lucide-react";
import { AttributeType, AttributeTypeFormData } from "@/src/types/attributes/type.attribute-type"; 
import { AttributeTypeForm } from "./attributes-type-form";

interface AttributeTypesTableProps {
  data: AttributeType[];
  onUpdate: (id: string, data: AttributeTypeFormData) => void;
  onDelete: (id: string) => void;
}

export function AttributeTypesTable({ data, onUpdate, onDelete }: AttributeTypesTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<AttributeType>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue("name")}
          <div className="text-xs text-muted-foreground font-mono">
            {row.original.code}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "inputType",
      header: "Tipo de Input",
      cell: ({ row }) => {
        const types: Record<string, string> = {
          text: "Texto",
          number: "Número",
          select: "Selección",
          boolean: "Sí/No",
          color: "Color",
          date: "Fecha",
        };
        return <Badge variant="outline">{types[row.getValue("inputType")]}</Badge>;
      },
    },
    {
      accessorKey: "isVariant",
      header: "Para Variantes",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isVariant") ? "default" : "secondary"}>
          {row.getValue("isVariant") ? "Sí" : "No"}
        </Badge>
      ),
    },
    {
      accessorKey: "affectsSku",
      header: "Afecta SKU",
      cell: ({ row }) => (
        <Badge variant={row.getValue("affectsSku") ? "default" : "secondary"}>
          {row.getValue("affectsSku") ? "Sí" : "No"}
        </Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch checked={row.getValue("isActive")} disabled />
          <span className="text-sm text-muted-foreground">
            {row.getValue("isActive") ? "Activo" : "Inactivo"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const type = row.original;
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
              <DropdownMenuSeparator />
              <AttributeTypeForm
                initialData={type}
                onSubmit={(data) => onUpdate(type.id, data)}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(type.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y botón nuevo */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tipos de atributo..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <AttributeTypeForm
          onSubmit={(data) => {
            console.log("Nuevo tipo:", data);
            // Aquí llamarías a tu API
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron tipos de atributo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-end space-x-2">
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