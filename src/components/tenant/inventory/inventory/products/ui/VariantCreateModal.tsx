"use client";

import { useState } from "react";
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
import { Product } from "@/src/types/product/type.product";
import { SingleImagePicker } from "./SingleImagePicker";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createVariantAction } from "@/src/app/(tenant)/tenant/actions/product.actions";

interface VariantCreateModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VariantCreateModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: VariantCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    variantCode: "",
    barcode: "",
    purchasePrice: 0,
    priceSell: 0,
    priceRent: 0,
    rentUnit: "día" as const,
    image: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!formData.variantCode) {
      toast.error("El código de variante es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const result = await createVariantAction(product.id, formData);
      if (result.success) {
        toast.success("Variante creada correctamente");
        setFormData({
            variantCode: "",
            barcode: "",
            purchasePrice: 0,
            priceSell: 0,
            priceRent: 0,
            rentUnit: "día",
            image: [],
        });
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "No se pudo crear la variante");
      }
    } catch (error) {
      toast.error("Error al procesar la creación");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const handleImageChange = (url: string) => {
    setFormData({ ...formData, image: url ? [url] : [] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nueva Variante para: {product.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código de Variante (SKU)</Label>
              <Input
                placeholder="Ej: XL-RED-001"
                value={formData.variantCode}
                onChange={(e) =>
                  setFormData({ ...formData, variantCode: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <Input
                placeholder="Opcional"
                value={formData.barcode}
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
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: Number(e.target.value) })
                }
              />
            </div>
            {product.can_sell && (
              <div className="space-y-2">
                <Label>Precio Venta</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.priceSell}
                  onChange={(e) =>
                    setFormData({ ...formData, priceSell: Number(e.target.value) })
                  }
                />
              </div>
            )}
            {product.can_rent && (
              <div className="space-y-2">
                <Label>Precio Renta</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.priceRent}
                  onChange={(e) =>
                    setFormData({ ...formData, priceRent: Number(e.target.value) })
                  }
                />
              </div>
            )}
          </div>

          {product.can_rent && (
            <div className="space-y-2">
              <Label>Unidad de Renta</Label>
              <Select
                value={formData.rentUnit}
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
                existingImages={product.image || []}
              />
              <p className="text-xs text-muted-foreground">
                Selecciona una imagen específica para esta variante.
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
                <Plus className="w-4 h-4 mr-2" />
              )}
              Crear Variante
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
