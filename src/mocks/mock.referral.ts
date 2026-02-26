// src/mocks/mock.referral.ts
import { Referral } from "../types/referral/type.referral";

export const MOCK_REFERRALS: Referral[] = [
  // Vamos a simular que el cliente cl_002 usó el código de cl_001
  {
    id: "ref-001",
    tenantId: "tenant-a",
    referrerClientId: "cl_001", // Juan Pérez
    referredClientId: "cl_002", // María Gómez
    status: "pending", // Sigue pending, si María compra algo, debería premiar a Juan
    createdAt: new Date("2024-03-05T09:00:00Z"),
  },
];
