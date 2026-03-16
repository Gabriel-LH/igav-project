"use client";

import { useMemo, useState } from "react";
import { Product } from "@/src/types/product/type.product";
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronRight,
  Package,
  Search,
  Trash2,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  History,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/src/utils/currency-format";
import { CostAdjustmentModal } from "../ui/CostAdjustmentModal";
import { VariantEditModal } from "../ui/VariantEditModal";
import { PlusCircle } from "lucide-react";

interface ProductTableProps {
  products: Product[];
  variants: ProductVariant[];
  onDeleteProduct: (productId: string) => void;
  onToggleVariant: (variantId: string, isActive: boolean) => void;
  onEditProduct: (productId: string) => void;
  onRefresh?: () => void;
}

export function ProductTable({
  products,
  variants,
  onDeleteProduct,
  onToggleVariant,
  onEditProduct,
  onRefresh,
}: ProductTableProps) {
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedVariantForCost, setSelectedVariantForCost] =
    useState<ProductVariant | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const router = useRouter();

  const variantsByProduct = useMemo(() => {
    const map = new Map<string, ProductVariant[]>();
    variants.forEach((variant) => {
      const current = map.get(variant.productId) ?? [];
      current.push(variant);
      map.set(variant.productId, current);
    });
    return map;
  }, [variants]);

  const filteredProducts = useMemo(() => {
    if (!filter) return products;
    const normalized = filter.toLowerCase();
    return products.filter((product) => {
      const productVariants = variantsByProduct.get(product.id) ?? [];
      return (
        product.name.toLowerCase().includes(normalized) ||
        product.baseSku.toLowerCase().includes(normalized) ||
        productVariants.some((variant) =>
          variant.variantCode.toLowerCase().includes(normalized),
        )
      );
    });
  }, [filter, products, variantsByProduct]);

  const toggleRow = (productId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // 2. Función que procesa el cambio
  const handleCostUpdate = (data: any) => {
    console.log("Enviando a la API y creando registro en PriceHistory:", data);
    // Aquí llamarías a tu Server Action o API
  };

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const paginatedProducts = filteredProducts.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize,
  );
  const canPreviousPage = safePageIndex > 0;
  const canNextPage = safePageIndex < pageCount - 1;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPageIndex(0);
          }}
          className="pl-9"
          placeholder="Buscar por producto, SKU o variante..."
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU Base</TableHead>
              <TableHead>Modo</TableHead>
              <TableHead>Disponibilidad</TableHead>
              <TableHead>Variantes</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.flatMap((product) => {
                const productVariants = variantsByProduct.get(product.id) ?? [];
                const isExpanded = expanded.has(product.id);

                const productRow = (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleRow(product.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <span>{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code>{product.baseSku}</code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.is_serial ? "default" : "secondary"}
                      >
                        {product.is_serial ? "Serializado" : "Por lotes"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {product.can_rent && (
                          <Badge variant="secondary">Renta</Badge>
                        )}
                        {product.can_sell && (
                          <Badge variant="secondary">Venta</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{productVariants.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditProduct(product.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );

                if (!isExpanded) return [productRow];

                const variantRows = productVariants.map((variant) => (
                  <TableRow key={variant.id} className="bg-muted/30">
                    <TableCell colSpan={2}>
                      <div className="flex items-center gap-2 pl-12">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <code>{variant.variantCode}</code>
                          {variant.barcode && (
                            <span className="text-[10px] text-muted-foreground">
                              {variant.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Costo
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            ${variant.purchasePrice || 0}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setSelectedVariantForCost(variant)} // <--- Disparador
                          >
                            <History className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex justify-between w-24">
                          <span className="text-muted-foreground">Renta:</span>
                          <span className="font-medium">
                            {formatCurrency(variant.priceRent ?? 0)}
                          </span>
                        </div>
                        <div className="flex justify-between w-24 border-t pt-1">
                          <span className="text-muted-foreground">Venta:</span>
                          <span className="font-medium">
                            {formatCurrency(variant.priceSell ?? 0)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell colSpan={2}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingVariant(variant)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                          title="Asignar Stock"
                          onClick={() => {
                            const product = products.find(p => p.id === variant.productId);
                            const path = product?.is_serial 
                              ? "/tenant/inventory/items" 
                              : "/tenant/inventory/stock";
                            router.push(`${path}?productId=${variant.productId}&variantId=${variant.id}`);
                          }}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {variant.isActive ? "Activo" : "Inactivo"}
                        </span>
                        <Switch
                          checked={variant.isActive}
                          onCheckedChange={(checked) =>
                            onToggleVariant(variant.id, checked)
                          }
                          className={cn(!variant.isActive && "opacity-70")}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ));

                return [productRow, ...variantRows];
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay productos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex w-full items-center justify-end gap-8 lg:w-fit lg:ml-auto">
          <div className="hidden items-center gap-2 lg:flex">
            <Label
              htmlFor="rows-per-page-product"
              className="text-sm font-medium"
            >
              Filas por pagina
            </Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPageIndex(0);
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-20"
                id="rows-per-page-product"
              >
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Pagina {safePageIndex + 1} de {pageCount}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPageIndex(0)}
              disabled={!canPreviousPage}
            >
              <span className="sr-only">Ir a la primera pagina</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              disabled={!canPreviousPage}
            >
              <span className="sr-only">Ir a la pagina anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() =>
                setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))
              }
              disabled={!canNextPage}
            >
              <span className="sr-only">Ir a la pagina siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => setPageIndex(pageCount - 1)}
              disabled={!canNextPage}
            >
              <span className="sr-only">Ir a la ultima pagina</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <CostAdjustmentModal
        variant={selectedVariantForCost}
        isOpen={!!selectedVariantForCost}
        onClose={() => setSelectedVariantForCost(null)}
        onConfirm={handleCostUpdate}
      />
      <VariantEditModal
        variant={editingVariant}
        product={
          editingVariant
            ? products.find((p) => p.id === editingVariant.productId) || null
            : null
        }
        isOpen={!!editingVariant}
        onClose={() => setEditingVariant(null)}
        onSuccess={() => {
          onRefresh?.();
        }}
      />
    </div>
  );
}
