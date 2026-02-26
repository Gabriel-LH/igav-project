import { create } from "zustand";
import { MOCK_REFERRALS } from "../mocks/mock.referral";

export interface Referral {
  id: string;
  tenantId: string;
  referrerClientId: string;
  referredClientId: string;
  status: "pending" | "completed";
  createdAt: Date;
  rewardedAt: Date | null;
}

interface ReferralState {
  referrals: Referral[];
  addReferral: (ref: Referral) => void;
}

export const useReferralStore = create<ReferralState>((set) => ({
  referrals: MOCK_REFERRALS as any,
  addReferral: (ref) =>
    set((state) => ({ referrals: [...state.referrals, ref as any] })),
}));
