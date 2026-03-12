// components/inventory/VariantAttributeSelector.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  X,
  Layers,
  AlertCircle,
  Check,
  ChevronsUpDown,
  Search,
  Building2,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { AttributeType } from "@/src/types/attributes/type.attribute-type";
import { AttributeValue } from "@/src/types/attributes/type.attribute-value";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/separator";
import { AttributeTypeForm } from "../../catalogs/attributes-type/attributes-type-form";
import { AttributeValueForm } from "../../catalogs/attribute-value/attribute-value-form";
import {
  createAttributeTypeAction,
  createAttributeValueAction,
} from "@/src/app/(tenant)/tenant/actions/attribute.actions";
import { useAttributeTypeStore } from "@/src/store/useAttributeTypeStore";
import { useAttributeValueStore } from "@/src/store/useAttributeValueStore";
import { AttributeTypeFormData } from "@/src/types/attributes/type.attribute-type";
import { AttributeValueFormData } from "@/src/types/attributes/type.attribute-value";
import { toast } from "sonner";

export interface SelectedAttributeConfig {
  attributeId: string;
  attributeName: string;
  attributeCode: string;
  values: SelectedValue[];
}

export interface SelectedValue {
  valueId: string;
  code: string;
  value: string;
}

interface VariantAttributeSelectorProps {
  attributeTypes: AttributeType[];
  attributeValues: AttributeValue[];
  selectedAttributes: SelectedAttributeConfig[];
  onChange: (attributes: SelectedAttributeConfig[]) => void;
  disabled?: boolean;
}

export function VariantAttributeSelector({
  attributeTypes,
  attributeValues,
  selectedAttributes,
  onChange,
  disabled = false,
}: VariantAttributeSelectorProps) {
  const [openTypePopover, setOpenTypePopover] = useState(false);
  const [openValuePopover, setOpenValuePopover] = useState<string | null>(null);
  const addAttributeType = useAttributeTypeStore((state) => state.addAttributeType);
  const addAttributeValue = useAttributeValueStore((state) => state.addAttributeValue);

  // Memoizar tipos de variante para evitar recálculos
  const variantTypes = useMemo(() => {
    return attributeTypes.filter(
      (t) => t.isVariant && t.affectsSku && t.isActive,
    );
  }, [attributeTypes]);

  // Memoizar función de búsqueda de valores
  const getValuesForType = useCallback(
    (typeId: string): AttributeValue[] => {
      return attributeValues.filter(
        (v) => v.attributeTypeId === typeId && v.isActive,
      );
    },
    [attributeValues],
  );

  const toggleAttributeType = useCallback(
    (type: AttributeType) => {
      const isSelected = selectedAttributes.some(
        (a) => a.attributeId === type.id,
      );
      if (isSelected) {
        onChange(selectedAttributes.filter((a) => a.attributeId !== type.id));
      } else {
        onChange([
          ...selectedAttributes,
          {
            attributeId: type.id,
            attributeName: type.name,
            attributeCode: type.code,
            values: [],
          },
        ]);
      }
    },
    [selectedAttributes, onChange],
  );
  // FIX: Manejar cambio de checkbox de forma estable
  const handleCheckboxChange = useCallback(
    (checked: boolean, type: AttributeType) => {
      if (checked) {
        // Solo agregar si no existe
        const exists = selectedAttributes.find(
          (a) => a.attributeId === type.id,
        );
        if (!exists) {
          onChange([
            ...selectedAttributes,
            {
              attributeId: type.id,
              attributeName: type.name,
              attributeCode: type.code,
              values: [],
            },
          ]);
        }
      } else {
        // Remover
        onChange(selectedAttributes.filter((a) => a.attributeId !== type.id));
      }
    },
    [selectedAttributes, onChange],
  );

  const toggleValue = useCallback(
    (attrId: string, value: AttributeValue) => {
      onChange(
        selectedAttributes.map((attr) => {
          if (attr.attributeId !== attrId) return attr;

          const valueExists = attr.values.find((v) => v.valueId === value.id);

          if (valueExists) {
            return {
              ...attr,
              values: attr.values.filter((v) => v.valueId !== value.id),
            };
          } else {
            return {
              ...attr,
              values: [
                ...attr.values,
                {
                  valueId: value.id,
                  code: value.code,
                  value: value.value,
                },
              ],
            };
          }
        }),
      );
    },
    [selectedAttributes, onChange],
  );

  const removeAttribute = useCallback(
    (attrId: string) => {
      onChange(selectedAttributes.filter((a) => a.attributeId !== attrId));
    },
    [selectedAttributes, onChange],
  );

  const removeValue = useCallback(
    (attrId: string, valueId: string) => {
      onChange(
        selectedAttributes.map((attr) =>
          attr.attributeId === attrId
            ? {
                ...attr,
                values: attr.values.filter((v) => v.valueId !== valueId),
              }
            : attr,
        ),
      );
    },
    [selectedAttributes, onChange],
  );

  const handleCreateAttributeType = useCallback(
    async (data: AttributeTypeFormData) => {
      const result = await createAttributeTypeAction(data);
      if (result.success && result.data) {
        addAttributeType(result.data);
        const exists = selectedAttributes.some(
          (attr) => attr.attributeId === result.data!.id,
        );
        if (!exists) {
          onChange([
            ...selectedAttributes,
            {
              attributeId: result.data.id,
              attributeName: result.data.name,
              attributeCode: result.data.code,
              values: [],
            },
          ]);
        }
        toast.success("Tipo de atributo creado correctamente");
      } else {
        toast.error(result.error || "No se pudo crear el tipo de atributo");
      }
    },
    [addAttributeType, onChange, selectedAttributes],
  );

  const handleCreateAttributeValue = useCallback(
    async (attributeTypeId: string, data: AttributeValueFormData) => {
      const result = await createAttributeValueAction({
        ...data,
        attributeTypeId,
      });
      if (result.success && result.data) {
        addAttributeValue(result.data);
        onChange(
          selectedAttributes.map((attr) => {
            if (attr.attributeId !== attributeTypeId) return attr;
            const exists = attr.values.some((v) => v.valueId === result.data!.id);
            if (exists) return attr;
            return {
              ...attr,
              values: [
                ...attr.values,
                {
                  valueId: result.data!.id,
                  code: result.data!.code,
                  value: result.data!.value,
                },
              ],
            };
          }),
        );
        toast.success("Valor de atributo creado correctamente");
      } else {
        toast.error(result.error || "No se pudo crear el valor de atributo");
      }
    },
    [addAttributeValue, onChange, selectedAttributes],
  );

  // Memoizar cálculos
  const totalCombinations = useMemo(() => {
    return selectedAttributes.reduce(
      (acc, attr) => acc * Math.max(attr.values.length, 1),
      1,
    );
  }, [selectedAttributes]);

  const hasEmptyValues = useMemo(() => {
    return selectedAttributes.some((a) => a.values.length === 0);
  }, [selectedAttributes]);

  if (false && variantTypes.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No hay tipos de atributo configurados para generar variantes. Ve a{" "}
          <strong>Catálogos &gt; Tipos de Atributos</strong> y marca algunos
          como &quot;Usar para Variantes&quot; y &quot;Afecta SKU&quot;.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* PASO 1: Seleccionar Tipos mediante Popover */}
      <div
        className={cn(
          "space-y-3",
          disabled && "opacity-60 pointer-events-none",
        )}
      >
        <div className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Layers className="w-4 h-4" />
          1. Atributos de variante
        </div>

        <div className="flex flex-col gap-3">
          <div className="w-full flex gap-10">
            <Popover open={openTypePopover} onOpenChange={setOpenTypePopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full md:w-[300px] justify-between border-dashed"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Agregar atributo...</span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar atributo (Talla, Color...)" />
                  <CommandList>
                    <CommandEmpty>No se encontraron atributos.</CommandEmpty>
                    <CommandGroup title="Atributos Disponibles">
                      {variantTypes.map((type) => {
                        const isSelected = selectedAttributes.some(
                          (a) => a.attributeId === type.id,
                        );
                        return (
                          <CommandItem
                            key={type.id}
                            onSelect={() => toggleAttributeType(type)}
                            className="flex items-center justify-between"
                          >
                            <span>{type.name}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <AttributeTypeForm
              onSubmit={handleCreateAttributeType}
              compact
              trigger={
                <Button variant="outline">
                  <Plus />
                  Crear
                </Button>
              }
            />
          </div>

          {/* Badges de atributos activos para acceso rápido/borrado */}
          {selectedAttributes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedAttributes.map((attr) => (
                <Badge
                  key={attr.attributeId}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 gap-1"
                >
                  {attr.attributeName}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full p-0 hover:bg-destructive hover:text-white"
                    onClick={() => removeAttribute(attr.attributeId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {selectedAttributes.length === 0 && (
          <Alert className="bg-muted/30 border-dashed">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Selecciona atributos o crea para empezar a crear variantes.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {selectedAttributes.length > 0 && <Separator />}

      {/* PASO 2: Seleccionar Valores (Tu lógica original mejorada visualmente) */}
      {selectedAttributes.length > 0 && (
        <div
          className={cn(
            "space-y-4",
            disabled && "opacity-60 pointer-events-none",
          )}
        >
          <div className="text-sm font-medium text-muted-foreground italic">
            2. Configura los valores para cada atributo seleccionado
          </div>

          <div className="grid grid-cols-1 gap-4">
            {selectedAttributes.map((attr) => {
              const availableValues = getValuesForType(attr.attributeId);
              const isOpen = openValuePopover === attr.attributeId;

              return (
                <div
                  key={attr.attributeId}
                  className="border rounded-xl p-3 space-y-2 bg-card shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Layers className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-tight">
                          {attr.attributeName}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          CODE: {attr.attributeCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full gap-6">
                    <Popover
                      open={isOpen}
                      onOpenChange={(open) =>
                        setOpenValuePopover(open ? attr.attributeId : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full max-w-10/12 justify-between bg-background"
                        >
                          <span
                            className={
                              attr.values.length > 0
                                ? "text-foreground"
                                : "text-muted-foreground text-xs"
                            }
                          >
                            {attr.values.length > 0
                              ? `${attr.values.length} valores elegidos`
                              : `Seleccionar valores de ${attr.attributeName}...`}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar valor..." />
                          <CommandList>
                            <CommandEmpty>
                              No hay valores disponibles.
                            </CommandEmpty>
                            <CommandGroup>
                              {availableValues.map((value) => {
                                const isSelected = attr.values.some(
                                  (v) => v.valueId === value.id,
                                );
                                return (
                                  <CommandItem
                                    key={value.id}
                                    onSelect={() =>
                                      toggleValue(attr.attributeId, value)
                                    }
                                  >
                                    <div
                                      className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                                        isSelected
                                          ? "bg-primary border-primary"
                                          : "opacity-50",
                                      )}
                                    >
                                      {isSelected && (
                                        <Check className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                    <span>{value.value}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <AttributeValueForm
                      attributeTypes={attributeTypes}
                      defaultAttributeTypeId={attr.attributeId}
                      onSubmit={(data) =>
                        handleCreateAttributeValue(attr.attributeId, data)
                      }
                      compact
                      trigger={
                        <Button variant="outline">
                          <Plus />
                          Crear
                        </Button>
                      }
                    />
                  </div>

                  {/* Visualización de valores como Badges */}
                  <div className="flex flex-wrap gap-2">
                    {attr.values.map((val) => (
                      <Badge
                        key={val.valueId}
                        variant="outline"
                        className="bg-muted/50 py-1 pr-1"
                      >
                        {val.value}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:text-destructive"
                          onClick={() =>
                            removeValue(attr.attributeId, val.valueId)
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen Final */}
          {!hasEmptyValues && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center justify-between mt-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Total de Variantes
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {selectedAttributes
                    .map((a) => `${a.values.length}`)
                    .join(" × ")}{" "}
                  combinaciones
                </p>
              </div>
              <div className="text-3xl font-black text-primary">
                {totalCombinations}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
