import { create } from "zustand";
import { Referral } from "../types/referral/type.referral";

interface ReferralState {
  referrals: Referral[];
  addReferral: (ref: Referral) => void;
}

export const useReferralStore = create<ReferralState>((set) => ({
  referrals: [],
  addReferral: (ref) =>
    set((state) => ({ referrals: [...state.referrals, ref as any] })),
}));
