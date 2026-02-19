import { create } from "zustand";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";

// Definimos el tipo de un solo cliente basado en el primer elemento del mock
type Customer = typeof CLIENTS_MOCK[0];

interface CustomerStore {
  customers: typeof CLIENTS_MOCK;
  addCustomer: (customer: Customer) => void;
  getCustomerById: (id: string) => Customer | undefined;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: CLIENTS_MOCK,

  addCustomer: (customer) => 
    set((state) => ({ customers: [...state.customers, customer] })),

  getCustomerById: (id) => {
    return get().customers.find((c) => c.id === id);
  },

  updateCustomer: (id, data) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: new Date() } : c,
      ),
    })),
}));