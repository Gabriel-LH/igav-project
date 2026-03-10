import { create } from "zustand";
import { persist } from "zustand/middleware";

interface VerifyStore {
  email: string;
  setEmailVerify: (email: string) => void;
  clearEmail: () => void;
}

export const useVerifyStore = create<VerifyStore>()(
  persist(
    (set) => ({
      email: "",
      setEmailVerify: (email) => set({ email }),
      clearEmail: () => set({ email: "" }),
    }),
    {
      name: "verify-email-storage",
    },
  ),
);
