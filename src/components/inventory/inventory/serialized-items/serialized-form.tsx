// components/inventory/SerializedItemForm.tsx
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
import { Badge } from "@/components/badge";
import { Barcode, Calendar, MapPin } from "lucide-react";
import { AttributeField } from "../../catalogs/attributes-type/attribute-field";
import { Attribute } from "../../catalogs/attributes-type/attribute-field";

interface SerializedItemFormData {
  serialNumber: string;
  productId: string;
  productName: string;
  warehouseId: string;
  status: "available" | "sold" | "maintenance" | "damaged";
  purchaseDate?: string;
  warrantyExpiry?: string;
  attributes: Attribute[]; // Atributos específicos del ítem serializado
}

interface SerializedItemFormProps {
  initialValues?: Partial<SerializedItemFormData>;
  onSubmit: (data: SerializedItemFormData) => void;
  products?: Array<{ id: string; name: string; sku: string }>;
  warehouses?: Array<{ id: string; name: string }>;
}

export function SerializedItemForm({
  initialValues,
  onSubmit,
  products = [],
  warehouses = [],
}: SerializedItemFormProps) {
  const [formData, setFormData] = useState<SerializedItemFormData>({
    serialNumber: "",
    productId: "",
    productName: "",
    warehouseId: "",
    status: "available",
    attributes: [],
    ...initialValues,
  });

  return (
    <form className="space-y-6">
      {/* Información del Serial */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Información del Ítem
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="serial" className="flex items-center gap-2">
              <Barcode className="w-4 h-4" />
              Número de Serie *
            </Label>
            <Input
              id="serial"
              value={formData.serialNumber}
              onChange={(e) =>
                setFormData({ ...formData, serialNumber: e.target.value })
              }
              placeholder="SN-123456789"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(val: SerializedItemFormData["status"]) =>
                setFormData({ ...formData, status: val })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="sold">Vendido</SelectItem>
                <SelectItem value="maintenance">En Mantenimiento</SelectItem>
                <SelectItem value="damaged">Dañado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Producto Asociado *</Label>
          <Select
            value={formData.productId}
            onValueChange={(val) => {
              const prod = products.find((p) => p.id === val);
              setFormData({
                ...formData,
                productId: val,
                productName: prod?.name || "",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar producto..." />
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Ubicación (Almacén)
            </Label>
            <Select
              value={formData.warehouseId}
              onValueChange={(val) =>
                setFormData({ ...formData, warehouseId: val })
              }
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
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha de Compra
            </Label>
            <Input
              type="date"
              value={formData.purchaseDate || ""}
              onChange={(e) =>
                setFormData({ ...formData, purchaseDate: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Vencimiento de Garantía</Label>
          <Input
            type="date"
            value={formData.warrantyExpiry || ""}
            onChange={(e) =>
              setFormData({ ...formData, warrantyExpiry: e.target.value })
            }
          />
        </div>
      </div>

      {/* Atributos específicos del ítem */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Especificaciones Técnicas
            </h3>
            <Badge variant="secondary">Dinámico</Badge>
          </div>

          <AttributeField
            attributes={formData.attributes}
            onChange={(attrs) =>
              setFormData({ ...formData, attributes: attrs })
            }
            availableTypes={["text", "number", "date", "boolean"]}
            maxAttributes={20}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit">Guardar Ítem Serializado</Button>
      </div>
    </form>
  );
}
