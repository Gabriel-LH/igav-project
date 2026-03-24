import { useCategoryStore } from "./useCategoryStore";
import { useModelStore } from "./useModelStore";
import { useBrandStore } from "./useBrandStore";

export const useAttributeStore = () => {
  const { getCategoryById } = useCategoryStore();
  const { getModelById } = useModelStore();
  const { getBrandById } = useBrandStore();

  // Helper for components that expect these in a single store
  return {
    getCategoryById,
    getModelById,
    getBrandById,
    
    // In this architecture, sizes/colors are AttributeValues filtered by type
    // If the component expects simple lookups, we provide them here
    getSizeById: (id: string) => ({ id, name: id }), // Placeholder if not unified
    getColorById: (id: string) => ({ id, name: id, hex: "#CCCCCC" }), // Placeholder
  };
};
