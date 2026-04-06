import { create } from "zustand";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfDay } from "date-fns";

export type TimeMode = "day" | "month" | "year";

interface AnalyticsFilters {
  timeMode: TimeMode;
  dateRange: DateRange | undefined;
  categoryId: string | "all";
  productId: string | null;
}

interface AnalyticsStore {
  appliedFilters: AnalyticsFilters;
  tempFilters: AnalyticsFilters;

  // Actions
  setTempFilters: (filters: Partial<AnalyticsFilters>) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

const getDefaultFilters = (): AnalyticsFilters => {
  const now = new Date();
  return {
    timeMode: "month",
    dateRange: {
      from: new Date(2024, 0, 1), // Start from 2024 to catch all historical/dummy data
      to: endOfDay(now),
    },
    categoryId: "all",
    productId: null,
  };
};

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  appliedFilters: getDefaultFilters(),
  tempFilters: getDefaultFilters(),

  setTempFilters: (filters) =>
    set((state) => ({
      tempFilters: { ...state.tempFilters, ...filters },
    })),

  applyFilters: () =>
    set((state) => ({
      appliedFilters: { ...state.tempFilters },
    })),

  resetFilters: () => {
    const defaults = getDefaultFilters();
    set({
      appliedFilters: defaults,
      tempFilters: defaults,
    });
  },
}));
