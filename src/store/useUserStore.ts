import { create } from "zustand";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface UserState {
  users: User[];
  setUsers: (users: User[]) => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  setUsers: (users) => set({ users }),
}));
