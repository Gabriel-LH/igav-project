// mocks/brands.ts
import { Brand } from "../types/brand/type.brand";

export const BRANDS_MOCK: Brand[] = [
  {
    id: "brand-1",
    tenantId: "tenant-a",
    name: "Samsung",
    slug: "samsung",
    description: "Electrónica y tecnología",
    logo: "https://logo.clearbit.com/samsung.com",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "brand-2",
    tenantId: "tenant-a",
    name: "Apple",
    slug: "apple",
    description: "Productos Apple",
    logo: "https://logo.clearbit.com/apple.com",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "brand-3",
    tenantId: "tenant-a",
    name: "Nike",
    slug: "nike",
    description: "Ropa deportiva",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "brand-4",
    tenantId: "tenant-a",
    name: "Adidas",
    slug: "adidas",
    isActive: false, // Inactiva para demo
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "brand-5",
    tenantId: "tenant-a",
    name: "Sony",
    slug: "sony",
    description: "Electrónica y audio",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];
