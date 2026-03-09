import { TenantStatus } from "@/prisma/generated/client";

export interface CreateTenantDTO {
  name: string;
  slug: string;
  ownerId: string;
  metadata?: any;
}

export interface UpdateTenantDTO {
  name?: string;
  slug?: string;
  status?: TenantStatus;
  metadata?: any;
}

export interface TenantRepository {
  create(data: CreateTenantDTO): Promise<any>;
  update(id: string, data: UpdateTenantDTO): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  suspend(id: string): Promise<any>;
  /** Called after create — seeds system roles (owner, admin, empleado, cajero) for the new tenant */
  provisionSystemRoles(tenantId: string, ownerId: string): Promise<void>;
}
