// components/inventory/TransferForm.tsx
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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AttributeField,
  Attribute,
} from "../../catalogs/attributes-type/attribute-field";
import { ArrowRightLeft, Package, MapPin } from "lucide-react";

interface TransferItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  serialNumbers?: string[]; // Para items serializados
  attributes: Attribute[];
}

interface TransferFormData {
  fromWarehouseId: string;
  toWarehouseId: string;
  referenceNumber: string;
  notes: string;
  scheduledDate: string;
  items: TransferItem[];
  transferAttributes: Attribute[]; // Atributos de la transferencia misma
}

interface TransferFormProps {
  initialValues?: Partial<TransferFormData>;
  onSubmit: (data: TransferFormData) => void;
  warehouses?: Array<{ id: string; name: string; location: string }>;
  products?: Array<{
    id: string;
    name: string;
    sku: string;
    hasSerials: boolean;
  }>;
}

export function TransferForm({
  initialValues,
  onSubmit,
  warehouses = [],
  products = [],
}: TransferFormProps) {
  const [formData, setFormData] = useState<TransferFormData>({
    fromWarehouseId: "",
    toWarehouseId: "",
    referenceNumber: "",
    notes: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    items: [],
    transferAttributes: [],
    ...initialValues,
  });

  const addItem = () => {
    const newItem: TransferItem = {
      id: crypto.randomUUID(),
      productId: "",
      productName: "",
      quantity: 1,
      attributes: [],
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const updateItem = (itemId: string, updates: Partial<TransferItem>) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    });
  };

  const removeItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== itemId),
    });
  };

  return (
    <form className="space-y-6">
      {/* Información General */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Detalles de Transferencia
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Número de Referencia</Label>
            <Input
              value={formData.referenceNumber}
              onChange={(e) =>
                setFormData({ ...formData, referenceNumber: e.target.value })
              }
              placeholder="TRF-2024-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha Programada</Label>
            <Input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData({ ...formData, scheduledDate: e.target.value })
              }
            />
          </div>
        </div>

        {/* Origen y Destino */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-blue-900">
                  <MapPin className="w-4 h-4" />
                  Almacén Origen *
                </Label>
                <Select
                  value={formData.fromWarehouseId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, fromWarehouseId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar origen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        <div className="flex flex-col">
                          <span>{wh.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {wh.location}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-green-900">
                  <MapPin className="w-4 h-4" />
                  Almacén Destino *
                </Label>
                <Select
                  value={formData.toWarehouseId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, toWarehouseId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar destino..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        <div className="flex flex-col">
                          <span>{wh.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {wh.location}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <Label>Notas / Instrucciones</Label>
          <Input
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Instrucciones especiales para la transferencia..."
          />
        </div>
      </div>

      <Separator />

      {/* Items a Transferir */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Productos a Transferir
          </h3>
          <Button type="button" onClick={addItem} size="sm" variant="outline">
            <Package className="w-4 h-4 mr-1" />
            Agregar Producto
          </Button>
        </div>

        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <Card key={item.id} className="relative">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Producto *</Label>
                        <Select
                          value={item.productId}
                          onValueChange={(val) => {
                            const prod = products.find((p) => p.id === val);
                            updateItem(item.id, {
                              productId: val,
                              productName: prod?.name || "",
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((prod) => (
                              <SelectItem key={prod.id} value={prod.id}>
                                <div className="flex flex-col">
                                  <span>{prod.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {prod.sku}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Cantidad *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, {
                              quantity: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Atributos específicos del ítem en transferencia */}
                    <div className="pt-2">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Atributos Específicos (Opcional)
                      </Label>
                      <AttributeField
                        attributes={item.attributes}
                        onChange={(attrs) =>
                          updateItem(item.id, { attributes: attrs })
                        }
                        maxAttributes={5}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {formData.items.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
              No hay productos agregados a la transferencia.
            </div>
          )}
        </div>
      </div>

      {/* Atributos de la Transferencia */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Atributos de la Transferencia
          </h3>
          <AttributeField
            attributes={formData.transferAttributes}
            onChange={(attrs) =>
              setFormData({ ...formData, transferAttributes: attrs })
            }
            maxAttributes={10}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit" className="gap-2">
          <ArrowRightLeft className="w-4 h-4" />
          Crear Transferencia
        </Button>
      </div>
    </form>
  );
}
