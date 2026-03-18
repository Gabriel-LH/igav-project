import { SelectedAttributeConfig, SelectedValue } from "@/src/application/interfaces/ProductForm";
import { AttributeType } from "@/src/types/attributes/type.attribute-type";
import { AttributeValue } from "@/src/types/attributes/type.attribute-value";
import { ProductVariant } from "@/src/types/product/type.productVariant";

/**
 * Reconstruye el array de `selectedAttributes` a partir de variantes existentes
 * en la base de datos. Cruza los keys de `variant.attributes` (e.g. "Color", "Talla")
 * con los `attributeTypes` disponibles y sus `attributeValues` para generar el mismo
 * formato que usa `ProductForm` al crear un producto nuevo.
 *
 * Esto permite que el formulario de edición muestre las variantes correctamente
 * y no las elimine al guardar.
 */
export function reconstructSelectedAttributes(
  variants: ProductVariant[],
  attributeTypes: AttributeType[],
  attributeValues: AttributeValue[],
): SelectedAttributeConfig[] {
  if (variants.length === 0) return [];

  // Recopilar todos los atributos únicos con sus valores únicos desde las variantes
  const attributeMap = new Map<string, Set<string>>();

  for (const variant of variants) {
    if (!variant.attributes) continue;
    for (const [attrName, attrValue] of Object.entries(variant.attributes)) {
      if (!attributeMap.has(attrName)) {
        attributeMap.set(attrName, new Set());
      }
      attributeMap.get(attrName)!.add(attrValue);
    }
  }

  // Ahora mapear esos atributos con los tipos y valores del catálogo
  const result: SelectedAttributeConfig[] = [];

  for (const [attrName, valueSet] of attributeMap) {
    // Buscar el tipo de atributo por nombre (case-insensitive)
    const attrType = attributeTypes.find(
      (t) => t.name.toLowerCase() === attrName.toLowerCase(),
    );

    if (!attrType) {
      // Si no encontramos el tipo, creamos una config "manual" sin IDs
      // Esto permite que al menos se muestren las variantes existentes
      const values: SelectedValue[] = Array.from(valueSet).map((val) => ({
        valueId: `manual-${attrName}-${val}`,
        code: val.substring(0, 3).toUpperCase(),
        value: val,
      }));

      result.push({
        attributeId: `manual-${attrName}`,
        attributeName: attrName,
        attributeCode: attrName.substring(0, 3).toUpperCase(),
        values,
      });
      continue;
    }

    // Buscar los valores del catálogo que coinciden
    const typeValues = attributeValues.filter(
      (v) => v.attributeTypeId === attrType.id && v.isActive,
    );

    const selectedValues: SelectedValue[] = [];
    for (const val of valueSet) {
      const catalogValue = typeValues.find(
        (tv) => tv.value.toLowerCase() === val.toLowerCase(),
      );

      if (catalogValue) {
        selectedValues.push({
          valueId: catalogValue.id,
          code: catalogValue.code,
          value: catalogValue.value,
        });
      } else {
        // Valor existe en variante pero no en catálogo (puede haberse eliminado)
        selectedValues.push({
          valueId: `manual-${attrType.id}-${val}`,
          code: val.substring(0, 3).toUpperCase(),
          value: val,
        });
      }
    }

    result.push({
      attributeId: attrType.id,
      attributeName: attrType.name,
      attributeCode: attrType.code,
      values: selectedValues,
    });
  }

  return result;
}
