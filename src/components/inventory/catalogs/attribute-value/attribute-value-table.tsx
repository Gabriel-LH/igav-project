// components/catalogs/attribute-values/AttributeValuesTable.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { MoreHorizontal, Pencil, Trash2, Search, Filter } from "lucide-react";
import {
  AttributeValue,
  AttributeValueFormData,
} from "@/src/types/attributes/type.attribute-value";
import { AttributeType } from "@/src/types/attributes/type.attribute-type";
import { AttributeValueForm } from "./attribute-value-form";

interface AttributeValuesTableProps {
  data: AttributeValue[];
  attributeTypes: AttributeType[];
  onUpdate: (id: string, data: AttributeValueFormData) => void;
  onDelete: (id: string) => void;
}

export function AttributeValuesTable({
  data,
  attributeTypes,
  onUpdate,
  onDelete,
}: AttributeValuesTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Filtrar por tipo de atributo
  const filteredData = useMemo(() => {
    if (typeFilter === "all") return data;
    return data.filter((item) => item.attributeTypeId === typeFilter);
  }, [data, typeFilter]);

  const columns: ColumnDef<AttributeValue>[] = [
    {
      accessorKey: "value",
      header: "Valor",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue("value")}
          <div className="text-xs text-muted-foreground font-mono">
            {row.original.code}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "attributeTypeId",
      header: "Tipo de Atributo",
      cell: ({ row }) => {
        const type = attributeTypes.find(
          (t) => t.id === row.original.attributeTypeId,
        );
        return type ? (
          <Badge variant="outline" className="gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  type.inputType === "color" ? "#000" : "transparent",
              }}
            />
            {type.name}
          </Badge>
        ) : (
          <Badge variant="destructive">Desconocido</Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.original.attributeTypeId === value;
      },
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
        const value = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <AttributeValueForm
                initialData={value}
                attributeTypes={attributeTypes}
                onSubmit={(data) => onUpdate(value.id, data)}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(value.id)}
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
    data: filteredData,
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
      {/* Header con filtros y botón nuevo */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar valores..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {attributeTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AttributeValueForm
          attributeTypes={attributeTypes}
          onSubmit={(data) => {
            console.log("Nuevo valor:", data);
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
                  No se encontraron valores de atributo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {data.length} valores
        </div>
        <div className="flex items-center gap-2">
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
    </div>
  );
}
