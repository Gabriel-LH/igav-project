// Domain contract for Role management within a tenant

export interface RoleDTO {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: { key: string; module: string; description: string | null }[];
  _count?: { userTenantMemberships: number };
}

export interface CreateRoleDTO {
  tenantId: string;
  name: string;
  description?: string;
  permissionKeys: string[]; // e.g. ["sales.view", "sales.create"]
}

export interface UpdateRolePermissionsDTO {
  roleId: string;
  tenantId: string;
  permissionKeys: string[];
}

export interface RoleRepository {
  findAll(tenantId: string): Promise<RoleDTO[]>;
  findById(id: string, tenantId: string): Promise<RoleDTO | null>;
  create(dto: CreateRoleDTO): Promise<RoleDTO>;
  updatePermissions(dto: UpdateRolePermissionsDTO): Promise<RoleDTO>;
  delete(id: string, tenantId: string): Promise<void>;
}
