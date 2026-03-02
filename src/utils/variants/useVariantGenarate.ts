// src/utils/variants/useVariantGenerator.ts
import { useMemo, useCallback } from "react";
import { generateBarcode } from "./barcode";
import {
  SelectedAttributeConfig,
  VariantOverride,
  ComputedVariant,
  SelectedValue,
} from "@/src/application/interfaces/ProductForm";

interface UseVariantGeneratorReturn {
  variants: ComputedVariant[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    withOverrides: number;
    combinationFormula: string;
  };
}

export function useVariantGenerator(
  baseSku: string,
  selectedAttributes: SelectedAttributeConfig[],
  overrides: Record<string, VariantOverride>,
  canRent: boolean,
  canSell: boolean,
): UseVariantGeneratorReturn {
  // Generar todas las combinaciones posibles de valores
  const generateCombinations = useCallback(
    (attrs: SelectedAttributeConfig[]): SelectedValue[][] => {
      if (attrs.length === 0) return [];
      if (attrs.some((a) => a.values.length === 0)) return [];

      const combine = (
        index: number,
        current: SelectedValue[],
      ): SelectedValue[][] => {
        if (index === attrs.length) return [current];
        const attr = attrs[index];
        return attr.values.flatMap((value) =>
          combine(index + 1, [...current, value]),
        );
      };

      return combine(0, []);
    },
    [],
  );

  // Crear signature única para identificar la variante
  const createSignature = useCallback(
    (
      attrs: SelectedAttributeConfig[],
      combination: SelectedValue[],
    ): string => {
      return attrs
        .map((attr, idx) => `${attr.attributeName}:${combination[idx].value}`)
        .join("|");
    },
    [],
  );

  // Generar código SKU
  const generateSku = useCallback(
    (base: string, attrs: Record<string, string>, index: number): string => {
      const attrCodes = Object.values(attrs)
        .map((v) => v.substring(0, 3).toUpperCase())
        .join("-");
      return `${base}-${attrCodes}-${String(index + 1).padStart(2, "0")}`;
    },
    [],
  );

  // COMPUTAR VARIANTES - CADA UNA CON SU PROPIO ÍNDICE
  const variants = useMemo((): ComputedVariant[] => {
    if (selectedAttributes.length === 0) return [];
    if (selectedAttributes.some((a) => a.values.length === 0)) return [];

    const combinations = generateCombinations(selectedAttributes);

    return combinations.map((combination, index) => {
      const signature = createSignature(selectedAttributes, combination);
      const override = overrides[signature];

      // Construir objeto de atributos
      const attributes: Record<string, string> = {};
      selectedAttributes.forEach((attr, idx) => {
        attributes[attr.attributeName] = combination[idx].value;
      });

      // 🔥 GENERAR BARCODE ÚNICO USANDO EL ÍNDICE DE LA VARIANTE
      const autoBarcode = generateBarcode(baseSku, attributes, index);

      return {
        id: `variant-${index}-${signature}`, // ID único incluye índice
        signature,
        variantCode:
          override?.variantCode ?? generateSku(baseSku, attributes, index),
        barcode: override?.barcode ?? autoBarcode, // ← Cada uno tiene el suyo
        attributes,
        priceRent: canRent ? (override?.priceRent ?? 0) : 0,
        priceSell: canSell ? (override?.priceSell ?? 0) : 0,
        rentUnit:
          (override?.rentUnit as
            | "hora"
            | "día"
            | "semana"
            | "mes"
            | "evento") ?? "día",
        isActive: override?.isActive ?? true,
        hasOverride: !!override,
      };
    });
  }, [
    selectedAttributes,
    overrides,
    baseSku,
    canRent,
    canSell,
    generateCombinations,
    createSignature,
    generateSku,
  ]);

  // STATS
  const stats = useMemo(() => {
    const total = variants.length;
    const active = variants.filter((v) => v.isActive).length;
    const withOverrides = variants.filter((v) => v.hasOverride).length;

    return {
      total,
      active,
      inactive: total - active,
      withOverrides,
      combinationFormula: selectedAttributes
        .map((a) => `${a.attributeName} (${a.values.length})`)
        .join(" × "),
    };
  }, [variants, selectedAttributes]);

  return { variants, stats };
}
