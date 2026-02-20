import { create } from "zustand";
import { Payment } from "../types/payments/type.payments"; // Ajusta la ruta

interface PaymentStore {
  payments: Payment[];
  addPayment: (payment: Payment) => void;
  getPaymentsByOperation: (operationId: string) => Payment[];
  updatePaymentStatus: (id: string, status: Payment["status"]) => void;
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  payments: [],

  addPayment: (payment) =>
    set((state) => ({ payments: [...state.payments, payment] })),

  getPaymentsByOperation: (operationId) => {
    return get().payments.filter(
      (p) => String(p.operationId) === String(operationId),
    );
  },
  updatePaymentStatus: (id, status) =>
    set((state) => ({
      payments: state.payments.map((p) => (p.id === id ? { ...p, status } : p)),
    })),
}));
