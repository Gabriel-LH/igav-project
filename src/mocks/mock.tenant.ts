import { Tenant } from "../types/tenant/type.tenant";
import { MOCK_TENANT_CONFIG } from "./mock.tenantConfig";

export const MOCK_TENANT: Tenant[] = [{
  id: "tenant-a",
  name: "Tenant Principal",
  status: "active",
  tenantConfig: MOCK_TENANT_CONFIG,
  createdAt: new Date(),
  updatedAt: new Date(),
  slug: "",
  ownerId: ""
}];
