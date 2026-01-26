import { ClientCreditLedger } from "@/src/types/clients/type.clientCreditLedgerSchema";
import { create } from "zustand";

type CreditState = {
  ledger: ClientCreditLedger[];
  addEntry: (entry: ClientCreditLedger) => void;
  getBalance: (clientId: string) => number;
};

export const useClientCreditStore = create<CreditState>((set, get) => ({
  ledger: [],

  addEntry: (entry) =>
    set((state) => ({
      ledger: [...state.ledger, entry],
    })),

  getBalance: (clientId) =>
    get().ledger
      .filter((l) => l.clientId === clientId)
      .reduce((sum, l) => sum + l.amount, 0),
}));
