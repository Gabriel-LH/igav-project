"use client";

import { useMemo, useState } from "react";
import { Product } from "@/src/types/product/type.product";
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/badge";
import { Switch } from "@/components/ui/switch";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductTableProps {
  products: Product[];
  variants: ProductVariant[];
  onDeleteProduct: (productId: string) => void;
  onToggleVariant: (variantId: string, isActive: boolean) => void;
}

export function ProductTable({
  products,
  variants,
  onDeleteProduct,
  onToggleVariant,
}: ProductTableProps) {
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
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
            {filteredProducts.length > 0 ? (
              filteredProducts.flatMap((product) => {
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
                      <Badge variant={product.is_serial ? "default" : "secondary"}>
                        {product.is_serial ? "Serializado" : "Por lotes"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {product.can_rent && <Badge variant="secondary">Renta</Badge>}
                        {product.can_sell && <Badge variant="secondary">Venta</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{productVariants.length}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );

                if (!isExpanded) return [productRow];

                const variantRows = productVariants.map((variant) => (
                  <TableRow key={variant.id} className="bg-muted/30">
                    <TableCell colSpan={2}>
                      <div className="flex items-center gap-2 pl-12">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <code>{variant.variantCode}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {variant.barcode ? "Con barcode" : "Sin barcode"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        Renta: {variant.priceRent ?? 0} / Venta: {variant.priceSell ?? 0}
                      </div>
                    </TableCell>
                    <TableCell colSpan={2}>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">Activo</span>
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
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay productos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
