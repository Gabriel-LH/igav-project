import {
  ProductFormData,
  SelectedAttributeConfig,
  SelectedValue,
  VariantOverride,
} from "@/src/application/interfaces/ProductForm";
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { generateBarcode } from "./barcode";

const buildCombinations = (
  attributes: SelectedAttributeConfig[],
): SelectedValue[][] => {
  if (attributes.length === 0) return [];
  if (attributes.some((attribute) => attribute.values.length === 0)) return [];

  const combine = (
    index: number,
    current: SelectedValue[],
  ): SelectedValue[][] => {
    if (index === attributes.length) return [current];
    const attribute = attributes[index];
    return attribute.values.flatMap((value) => combine(index + 1, [...current, value]));
  };

  return combine(0, []);
};

const createSignature = (
  attributes: SelectedAttributeConfig[],
  values: SelectedValue[],
): string =>
  attributes
    .map((attribute, index) => `${attribute.attributeName}:${values[index].value}`)
    .join("|");

const createVariantCode = (
  baseSku: string,
  attributes: Record<string, string>,
  index: number,
): string => {
  const attributeCode = Object.values(attributes)
    .map((value) => value.substring(0, 3).toUpperCase())
    .join("-");
  return `${baseSku}-${attributeCode}-${String(index + 1).padStart(2, "0")}`;
};

export const buildVariantsFromProductForm = (
  tenantId: string,
  productId: string,
  formData: ProductFormData,
): ProductVariant[] => {
  const combinations = buildCombinations(formData.selectedAttributes);
  const now = new Date();

  return combinations.map((combination, index) => {
    const signature = createSignature(formData.selectedAttributes, combination);
    const override: VariantOverride | undefined = formData.variantOverrides[signature];

    const attributes: Record<string, string> = {};
    formData.selectedAttributes.forEach((attribute, attributeIndex) => {
      attributes[attribute.attributeName] = combination[attributeIndex].value;
    });

    const variantCode =
      override?.variantCode ?? createVariantCode(formData.baseSku, attributes, index);
    const barcode = override?.barcode ?? generateBarcode(formData.baseSku, attributes, index);

    return {
      id: `variant-${crypto.randomUUID()}`,
      tenantId,
      productId,
      variantCode,
      variantSignature: signature,
      barcode,
      attributes,
      purchasePrice: override?.purchasePrice ?? 0,
      priceSell: formData.can_sell ? (override?.priceSell ?? 0) : 0,
      priceRent: formData.can_rent ? (override?.priceRent ?? 0) : 0,
      rentUnit: (override?.rentUnit as any) ?? "día",
      image: override?.images ?? formData.image ?? [],
      isActive: override?.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
  });
};
