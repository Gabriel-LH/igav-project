import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";

const businessRules = BUSINESS_RULES_MOCK;

export type Period = "AM" | "PM";

export const STORE_HOURS = {
  open: businessRules.openHours.open,
  close: businessRules.openHours.close,
  stepMinutes: 10,
};

// Conversión
export const to12Hour = (hour24: number) => {
  const period: Period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return { hour12, period };
};

export const to24Hour = (hour12: number, period: Period) =>
  period === "AM"
    ? hour12 === 12
      ? 0
      : hour12
    : hour12 === 12
      ? 12
      : hour12 + 12;

// Reglas de negocio
export const isHourAllowed = (hour24: number) =>
  hour24 >= STORE_HOURS.open && hour24 < STORE_HOURS.close;

// Listado de horas permitidas (12h)
export const getAllowedHours = (period: Period) =>
  Array.from({ length: 12 }, (_, i) => i + 1).filter((h12) =>
    isHourAllowed(to24Hour(h12, period)),
  );

// Minutos permitidos según step
export const getAllowedMinutes = () =>
  Array.from({ length: 60 / STORE_HOURS.stepMinutes }, (_, i) =>
    (i * STORE_HOURS.stepMinutes).toString().padStart(2, "0"),
  );
