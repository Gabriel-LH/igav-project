import { create } from "zustand";
import { Payment } from "../types/payments/type.payments"; // Ajusta la ruta

interface PaymentStore {
  payments: Payment[];
  addPayment: (payment: Payment) => void;
  getPaymentsByOperation: (operationId: string) => Payment[];
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  payments: [],

  addPayment: (payment) =>
    set((state) => ({ payments: [...state.payments, payment] })),

  getPaymentsByOperation: (operationId) => {
    return get().payments.filter((p) => String(p.operationId) === String(operationId));
  },
}));