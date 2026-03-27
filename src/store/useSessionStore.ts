import { create } from "zustand";

interface UserSession {
  id: string;
  email: string;
  name: string;
}

interface UserMembership {
  tenantId: string;
  role: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
}

interface SessionState {
  user: UserSession | null;
  membership: UserMembership | null;
  setSession: (user: UserSession, membership: UserMembership) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  membership: null,
  setSession: (user, membership) => set({ user, membership }),
  clearSession: () => set({ user: null, membership: null }),
}));
