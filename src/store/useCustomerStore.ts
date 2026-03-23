import { create } from "zustand";
import { Client } from "@/src/types/clients/type.client";

type Customer = Client;

interface CustomerStore {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  getCustomerById: (id: string) => Customer | undefined;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],

  setCustomers: (customers) => set({ customers }),

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
