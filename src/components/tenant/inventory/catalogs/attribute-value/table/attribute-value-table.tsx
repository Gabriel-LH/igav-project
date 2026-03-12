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
import { Label } from "@/components/label";
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
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  AttributeValue,
  AttributeValueFormData,
} from "@/src/types/attributes/type.attribute-value";
import { AttributeType } from "@/src/types/attributes/type.attribute-type";
import { AttributeValueForm } from "../attribute-value-form";

interface AttributeValuesTableProps {
  data: AttributeValue[];
  attributeTypes: AttributeType[];
  onCreate: (data: AttributeValueFormData) => void;
  onUpdate: (id: string, data: AttributeValueFormData) => void;
  onDelete: (id: string) => void;
}

export function AttributeValuesTable({
  data,
  attributeTypes,
  onCreate,
  onUpdate,
  onDelete,
}: AttributeValuesTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  // Filtrar por tipo de atributo
  const filteredData = useMemo(() => {
    if (typeFilter === "all") return data;
    return data.filter((item) => item.attributeTypeId === typeFilter);
  }, [data, typeFilter]);

  const columns: ColumnDef<AttributeValue>[] = [
    {
      accessorKey: "value",
      header: "Valor",
      cell: ({ row }) => {
        const type = attributeTypes.find(
          (t) => t.id === row.original.attributeTypeId,
        );
        const isColor = type?.inputType === "color";

        return (
          <div className="font-medium flex items-center gap-2">
            {isColor && row.original.hexColor && (
              <span
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: row.original.hexColor }}
                title={row.original.hexColor}
              />
            )}
            <span>{row.getValue("value") as string}</span>
            <div className="text-xs text-muted-foreground font-mono">
              {row.original.code}
            </div>
          </div>
        );
      },
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
          <Switch checked={row.getValue("isActive") as boolean} disabled />
          <span className="text-sm text-muted-foreground">
            {(row.getValue("isActive") as boolean) ? "Activo" : "Inactivo"}
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
                open={open}
                onOpenChange={setOpen}
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
          onSubmit={onCreate}
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

      {/* Paginacion */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex w-full items-center justify-end gap-8 lg:w-fit lg:ml-auto">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page-attribute-value" className="text-sm font-medium">
              Filas por pagina
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-20"
                id="rows-per-page-attribute-value"
              >
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Pagina {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a la primera pagina</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a la pagina anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a la pagina siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a la ultima pagina</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

