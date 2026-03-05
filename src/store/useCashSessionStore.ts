import { create } from "zustand";
import { CashSession } from "../types/cash/type.cash";
import { MOCK_SESSIONS } from "../mocks/mock.cashSession";

interface CashSessionState {
  sessions: CashSession[];
  isLoading: boolean;
  loadSessions: () => Promise<void>;
  addSession: (session: CashSession) => void;
  updateSession: (id: string, session: Partial<CashSession>) => void;
  closeSession: (id: string, countedAmount: number) => void;
}

export const useCashSessionStore = create<CashSessionState>((set) => ({
  sessions: [],
  isLoading: false,
  loadSessions: async () => {
    set({ isLoading: true });
    // Simular carga
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ sessions: MOCK_SESSIONS, isLoading: false });
  },
  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
    })),
  updateSession: (id, updated) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...updated } : s,
      ),
    })),
  closeSession: (id, countedAmount) =>
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== id) return s;

        const expected = s.closingExpectedAmount || 0;
        const difference = countedAmount - expected;

        return {
          ...s,
          status: "closed",
          closedAt: new Date(),
          closingCountedAmount: countedAmount,
          closingDifference: difference,
        };
      }),
    })),
}));
