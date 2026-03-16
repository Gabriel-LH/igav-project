"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { Product } from "@/src/types/product/type.product";
import { SingleImagePicker } from "./SingleImagePicker";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateVariantAction } from "@/src/app/(tenant)/tenant/actions/product.actions";

interface VariantEditModalProps {
  variant: ProductVariant | null;
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VariantEditModal({
  variant,
  product,
  isOpen,
  onClose,
  onSuccess,
}: VariantEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ProductVariant>>({});

  useEffect(() => {
    if (variant) {
      setFormData({
        variantCode: variant.variantCode,
        barcode: variant.barcode,
        purchasePrice: variant.purchasePrice,
        priceSell: variant.priceSell,
        priceRent: variant.priceRent,
        rentUnit: variant.rentUnit,
        image: Array.isArray(variant.image) ? variant.image : [],
        isActive: variant.isActive,
      });
    }
  }, [variant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant) return;

    setLoading(true);
    try {
      const result = await updateVariantAction(variant.id, formData);
      if (result.success) {
        toast.success("Variante actualizada correctamente");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "No se pudo actualizar la variante");
      }
    } catch (error) {
      toast.error("Error al procesar la actualización");
    } finally {
      setLoading(false);
    }
  };

  if (!variant) return null;

  const handleImageChange = (url: string) => {
    setFormData({ ...formData, image: url ? [url] : [] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Variante: {variant.variantCode}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código de Variante (SKU)</Label>
              <Input
                value={formData.variantCode || ""}
                onChange={(e) =>
                  setFormData({ ...formData, variantCode: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <Input
                value={formData.barcode || ""}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Costo de Compra</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.purchasePrice || 0}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: Number(e.target.value) })
                }
              />
            </div>
            {product?.can_sell && (
              <div className="space-y-2">
                <Label>Precio Venta</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.priceSell || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, priceSell: Number(e.target.value) })
                  }
                />
              </div>
            )}
            {product?.can_rent && (
              <div className="space-y-2">
                <Label>Precio Renta</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.priceRent || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, priceRent: Number(e.target.value) })
                  }
                />
              </div>
            )}
          </div>

          {product?.can_rent && (
            <div className="space-y-2">
              <Label>Unidad de Renta</Label>
              <Select
                value={formData.rentUnit || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, rentUnit: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hora">Por Hora</SelectItem>
                  <SelectItem value="día">Por Día</SelectItem>
                  <SelectItem value="semana">Por Semana</SelectItem>
                  <SelectItem value="mes">Por Mes</SelectItem>
                  <SelectItem value="evento">Por Evento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Imagen de Variante</Label>
            <div className="flex items-center gap-4">
              <SingleImagePicker
                value={formData.image?.[0] || ""}
                onChange={handleImageChange}
                existingImages={product?.image || []}
              />
              <p className="text-xs text-muted-foreground">
                Haz clic para subir o seleccionar una imagen para esta variante.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
