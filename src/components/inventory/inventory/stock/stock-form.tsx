// components/inventory/StockForm.tsx
"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  AttributeField,
  Attribute,
} from "../../catalogs/attributes-type/attribute-field";

import { Warehouse, Plus } from "lucide-react";

interface StockLocation {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  attributes: Attribute[];
}

interface StockFormData {
  productId: string;
  productName: string;
  locations: StockLocation[];
  movementType?: "entry" | "exit" | "transfer";
}

interface StockFormProps {
  initialValues?: Partial<StockFormData>;
  onSubmit: (data: StockFormData) => void;
  warehouses?: Array<{ id: string; name: string }>;
  products?: Array<{ id: string; name: string; sku: string }>;
}

export function StockForm({
  initialValues,
  onSubmit,
  warehouses = [],
  products = [],
}: StockFormProps) {
  const [formData, setFormData] = useState<StockFormData>({
    productId: "",
    productName: "",
    locations: [],
    ...initialValues,
  });

  const addLocation = () => {
    const newLocation: StockLocation = {
      warehouseId: "",
      warehouseName: "",
      quantity: 0,
      minStock: 0,
      maxStock: 100,
      attributes: [],
    };
    setFormData({
      ...formData,
      locations: [...formData.locations, newLocation],
    });
  };

  const updateLocation = (index: number, updates: Partial<StockLocation>) => {
    const updated = [...formData.locations];
    updated[index] = { ...updated[index], ...updates };
    setFormData({ ...formData, locations: updated });
  };

  const removeLocation = (index: number) => {
    setFormData({
      ...formData,
      locations: formData.locations.filter((_, i) => i !== index),
    });
  };

  return (
    <form className="space-y-6">
      {/* Selección de Producto */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Producto
        </h3>

        <div className="space-y-2">
          <Label>Seleccionar Producto *</Label>
          <Select
            value={formData.productId}
            onValueChange={(val) => {
              const product = products.find((p) => p.id === val);
              setFormData({
                ...formData,
                productId: val,
                productName: product?.name || "",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Buscar producto..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.sku}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ubicaciones de Stock */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Ubicaciones y Cantidades
          </h3>
          <Button
            type="button"
            onClick={addLocation}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar Ubicación
          </Button>
        </div>

        <div className="space-y-4">
          {formData.locations.map((location, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Warehouse className="w-4 h-4" />
                    Ubicación {index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLocation(index)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Almacén *</Label>
                    <Select
                      value={location.warehouseId}
                      onValueChange={(val) => {
                        const wh = warehouses.find((w) => w.id === val);
                        updateLocation(index, {
                          warehouseId: val,
                          warehouseName: wh?.name || "",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cantidad Actual *</Label>
                    <Input
                      type="number"
                      value={location.quantity}
                      onChange={(e) =>
                        updateLocation(index, {
                          quantity: Number(e.target.value),
                        })
                      }
                      min={0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stock Mínimo</Label>
                    <Input
                      type="number"
                      value={location.minStock}
                      onChange={(e) =>
                        updateLocation(index, {
                          minStock: Number(e.target.value),
                        })
                      }
                      min={0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Stock Máximo</Label>
                    <Input
                      type="number"
                      value={location.maxStock}
                      onChange={(e) =>
                        updateLocation(index, {
                          maxStock: Number(e.target.value),
                        })
                      }
                      min={0}
                    />
                  </div>
                </div>

                {/* Atributos específicos de ubicación */}
                <div className="pt-2 border-t">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Atributos de Ubicación (Opcional)
                  </Label>
                  <AttributeField
                    attributes={location.attributes}
                    onChange={(attrs) =>
                      updateLocation(index, { attributes: attrs })
                    }
                    maxAttributes={5}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {formData.locations.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
              No hay ubicaciones configuradas. Agrega una para comenzar.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit">Guardar Stock</Button>
      </div>
    </form>
  );
}
