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
import { X, Layers, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { AttributeType } from "@/src/types/attributes/type.attribute-type";
import { AttributeValue } from "@/src/types/attributes/type.attribute-value";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/separator";

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
  const [openPopover, setOpenPopover] = useState<string | null>(null);

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

  // FIX: Usar useCallback para evitar recreación de funciones
  const toggleAttributeType = useCallback(
    (type: AttributeType) => {
      const exists = selectedAttributes.find((a) => a.attributeId === type.id);

      if (exists) {
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

  if (variantTypes.length === 0) {
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
    <div>
      {/* PASO 1: Seleccionar Tipos */}
      <div
        className={
          disabled ? "opacity-60 pointer-events-none w-full" : "w-full"
        }
      >
        <div className="text-sm font-medium flex items-center mb-2 gap-2">
          <Layers className="w-4 h-4" />
          1. Selecciona atributos que generarán variantes
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {variantTypes.map((type) => {
              const isSelected = selectedAttributes.some(
                (a) => a.attributeId === type.id,
              );
              const availableValues = getValuesForType(type.id).length;

              return (
                <div
                  key={type.id}
                  className={cn(
                    "flex items-center space-x-3 bg-primary/3 rounded-lg px-4 py-3 transition-all",
                    isSelected
                      ? "border bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50",
                  )}
                >
                  {/* FIX: Checkbox con onCheckedChange estable */}
                  <Checkbox
                    id={`attr-${type.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(checked as boolean, type)
                    }
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor={`attr-${type.id}`}
                      className="text-sm font-semibold cursor-pointer"
                    >
                      {type.name}
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      {availableValues} valores • {type.inputType}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedAttributes.length === 0 && (
            <Alert className="bg-muted/50 border-dashed">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Selecciona al menos un atributo para generar variantes.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      {/* PASO 2: Seleccionar Valores */}
      {selectedAttributes.length > 0 && (
        <div className={disabled ? "opacity-60 pointer-events-none" : ""}>
          <div className="text-sm font-medium mb-2">
            2. Selecciona valores del catálogo
          </div>

          <div className="space-y-6">
            {selectedAttributes.map((attr) => {
              const availableValues = getValuesForType(attr.attributeId);
              const isOpen = openPopover === attr.attributeId;

              return (
                <div
                  key={attr.attributeId}
                  className="border rounded-lg p-4 space-y-4 bg-card"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-base flex items-center gap-2">
                        {attr.attributeName}
                        <Badge variant="outline" className="font-mono text-xs">
                          {attr.attributeCode}
                        </Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {availableValues.length} valores disponibles
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttribute(attr.attributeId)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Popover
                    open={isOpen}
                    onOpenChange={(open) =>
                      setOpenPopover(open ? attr.attributeId : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span
                          className={
                            attr.values.length > 0
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {attr.values.length > 0
                            ? `${attr.values.length} valores seleccionados`
                            : `Seleccionar valores de ${attr.attributeName.toLowerCase()}...`}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder={`Buscar ${attr.attributeName.toLowerCase()}...`}
                        />
                        <CommandList>
                          <CommandEmpty>
                            No hay valores. Agrega en Catálogos &gt; Valores.
                          </CommandEmpty>
                          <CommandGroup>
                            {availableValues.map((value) => {
                              const isSelected = attr.values.some(
                                (v) => v.valueId === value.id,
                              );
                              return (
                                <CommandItem
                                  key={value.id}
                                  onSelect={() => {
                                    toggleValue(attr.attributeId, value);
                                    // No cerrar el popover para permitir selección múltiple
                                  }}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <div
                                    className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                      isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "opacity-50 [&_svg]:invisible",
                                    )}
                                  >
                                    <Check
                                      className={cn(
                                        "h-3 w-3",
                                        isSelected ? "visible" : "",
                                      )}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {value.value}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                      {value.code}
                                    </div>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Valores seleccionados */}
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {attr.values.length > 0 ? (
                      attr.values.map((val) => (
                        <Badge
                          key={val.valueId}
                          variant="secondary"
                          className="px-3 py-1.5 text-sm gap-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={() =>
                            removeValue(attr.attributeId, val.valueId)
                          }
                        >
                          <span className="font-medium">{val.value}</span>
                          <span className="text-xs opacity-70 font-mono">
                            ({val.code})
                          </span>
                          <X className="w-3 h-3" />
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic py-1">
                        Selecciona al menos un valor...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {hasEmptyValues && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Todos los atributos deben tener al menos un valor
                  seleccionado.
                </AlertDescription>
              </Alert>
            )}

            {/* Resumen */}
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-medium text-primary">
                  Combinaciones a generar:
                </span>
                <p className="text-xs text-muted-foreground">
                  {selectedAttributes
                    .map((a) => `${a.attributeName} (${a.values.length})`)
                    .join(" × ")}
                </p>
              </div>
              <Badge variant="default" className="text-lg px-4 py-1">
                {totalCombinations}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
