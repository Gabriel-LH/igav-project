import { Tenant } from "../types/tenant/type.tenant";
import { BUSINESS_RULES_MOCK } from "./mock.bussines_rules";

export const MOCK_TENANT: Tenant = {
  id: "tenant-a",
  name: "Tenant Principal",
  status: "active",
  bussinesRuls: BUSINESS_RULES_MOCK,
  createdAt: new Date(),
  updatedAt: new Date(),
};
