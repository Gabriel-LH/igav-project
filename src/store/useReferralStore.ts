import { create } from "zustand";
import { MOCK_REFERRALS } from "../mocks/mock.referral";

import { Referral } from "../types/referral/type.referral";

interface ReferralState {
  referrals: Referral[];
  addReferral: (ref: Referral) => void;
}

export const useReferralStore = create<ReferralState>((set) => ({
  referrals: MOCK_REFERRALS as any,
  addReferral: (ref) =>
    set((state) => ({ referrals: [...state.referrals, ref as any] })),
}));
