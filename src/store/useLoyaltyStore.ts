// src/store/useLoyaltyStore.ts
import { create } from "zustand";
import { ClientLoyaltyLedger } from "../types/clients/type.clientLoyaltyLedger";

interface LoyaltyState {
  ledger: ClientLoyaltyLedger[];

  // Acciones
  addEntry: (entry: ClientLoyaltyLedger) => void;
  getHistoryByClient: (clientId: string) => ClientLoyaltyLedger[];
}

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  ledger: [],

  addEntry: (entry) =>
    set((state) => ({
      ledger: [...state.ledger, entry],
    })),

  getHistoryByClient: (clientId) =>
    get()
      .ledger.filter((l) => l.clientId === clientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), // Ordenar por fecha desc
}));
