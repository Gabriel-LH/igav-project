export interface UpdateCategoryInput {
  categoryId: string;
  tenantId: string;
  name?: string;
  description?: string;
  parentId?: string | null;
  order?: number;
  image?: string;
  color?: string;
  icon?: string;
  slug?: string;
  isActive?: boolean;
  showInPos?: boolean;
  showInEcommerce?: boolean;
  updatedBy?: string;
}
