import { create } from "zustand";

interface VerifyStore {
  email: string;
  setEmailVerify: (email: string) => void;
  clearEmail: () => void;
}

export const useVerifyStore = create<VerifyStore>((set) => ({
  email: "",
  setEmailVerify: (email) => set({ email }),
  clearEmail: () => set({ email: "" }),
}));
