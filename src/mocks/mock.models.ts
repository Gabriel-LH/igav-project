// mocks/models.ts
import { Model } from "@/src/types/model/type.model";

export const MODELS_MOCK: Model[] = [
  // Samsung models
  {
    id: "model-1",
    tenantId: "tenant-a",
    brandId: "brand-1", // Samsung
    name: "Galaxy S24",
    slug: "galaxy-s24",
    description: "Smartphone flagship 2024",
    year: 2024,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "model-2",
    tenantId: "tenant-a",
    brandId: "brand-1", // Samsung
    name: "Galaxy Tab S9",
    slug: "galaxy-tab-s9",
    year: 2023,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Apple models
  {
    id: "model-3",
    tenantId: "tenant-a",
    brandId: "brand-2", // Apple
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    description: "iPhone flagship",
    year: 2023,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "model-4",
    tenantId: "tenant-a",
    brandId: "brand-2", // Apple
    name: "MacBook Pro M3",
    slug: "macbook-pro-m3",
    year: 2023,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Nike models
  {
    id: "model-5",
    tenantId: "tenant-a",
    brandId: "brand-3", // Nike
    name: "Air Max 90",
    slug: "air-max-90",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "model-6",
    tenantId: "tenant-a",
    brandId: "brand-3", // Nike
    name: "Air Force 1",
    slug: "air-force-1",
    isActive: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];
