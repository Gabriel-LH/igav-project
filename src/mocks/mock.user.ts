// src/mocks/mock.user.ts

export interface UserMock {
  id: string;
  name: string;
  email: string;
  branchId: string | null;
  role: string;
}

export const USER_MOCK: UserMock[] = [
  {
    id: "kab07nOyDBZ01vBKJPbc07yl6qN2wYwZ",
    name: "Vendedor de Prueba",
    email: "vendedor@igav.com",
    branchId: "45b6e390-5186-4531-bace-cf9d97d81aee",
    role: "seller",
  },
];
