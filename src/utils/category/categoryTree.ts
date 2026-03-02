// lib/categoryTree.ts
import { Category, CategoryNode } from "@/src/types/category/type.category";

// Construir árbol jerárquico
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  // Primera pasada: crear nodos
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [], fullPath: cat.name });
  });

  // Segunda pasada: establecer relaciones padre-hijo
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id)!;

    if (cat.parentId && categoryMap.has(cat.parentId)) {
      const parent = categoryMap.get(cat.parentId)!;
      parent.children.push(node);
      // Ordenar hijos por order
      parent.children.sort((a, b) => a.order! - b.order!);
    } else {
      roots.push(node);
    }
  });

  // Ordenar raíces
  roots.sort((a, b) => a.order! - b.order!);

  // Calcular fullPath recursivamente
  const calculatePath = (node: CategoryNode, parentPath: string = "") => {
    const currentPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
    node.fullPath = currentPath;
    node.children.forEach((child) => calculatePath(child, currentPath));
  };

  roots.forEach((root) => calculatePath(root));

  return roots;
}

// Aplanar árbol para selectores (con indentación visual)
export function flattenCategories(
  categories: Category[],
  includeInactive: boolean = false,
): Array<{ value: string; label: string; level: number; disabled?: boolean }> {
  const tree = buildCategoryTree(
    categories.filter((c) => includeInactive || c.isActive),
  );

  const result: Array<{
    value: string;
    label: string;
    level: number;
    disabled?: boolean;
  }> = [];

  const traverse = (nodes: CategoryNode[], level: number = 0) => {
    nodes.forEach((node) => {
      result.push({
        value: node.id,
        label: node.name,
        level,
        disabled: !node.isActive,
      });
      if (node.children.length > 0) {
        traverse(node.children, level + 1);
      }
    });
  };

  traverse(tree);
  return result;
}

// Obtener descendientes (para validaciones)
export function getDescendants(
  categories: Category[],
  parentId: string,
): string[] {
  const result: string[] = [];
  const children = categories.filter((c) => c.parentId === parentId);

  children.forEach((child) => {
    result.push(child.id);
    result.push(...getDescendants(categories, child.id));
  });

  return result;
}

// Generar slug único
export function generateSlug(name: string, existingSlugs: string[]): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = base;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}
