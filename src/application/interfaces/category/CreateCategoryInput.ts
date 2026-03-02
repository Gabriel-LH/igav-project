export interface CreateCategoryInput {
  name: string; // Ej: "Ternos"
  tenantId: string;
  description?: string;

  parentId?: string;
  order?: number;
  image?: string; // Para botones en el POS
  color?: string;
  icon?: string;
  slug?: string;

  //Comportamiento
  isActive?: boolean;
  showInPos?: boolean;
  showInEcommerce?: boolean;

  productCount?: number; // Contador de productos directos
  totalProductCount?: number; // Productos incluyendo subcategorías

  createdBy?: string;
}
