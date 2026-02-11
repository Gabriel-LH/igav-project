import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";

const businessRules = BUSINESS_RULES_MOCK;

export type Period = "AM" | "PM";

const parseTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":").map(Number);
  return { hour: h, minute: m };
};

const openTime = parseTime(businessRules.openHours.open);  // { hour: 8, minute: 30 }
const closeTime = parseTime(businessRules.openHours.close);

export const STORE_HOURS = {
  openHour: openTime.hour,
  openMinute: openTime.minute,
  closeHour: closeTime.hour,
  closeMinute: closeTime.minute,
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
  hour24 >= STORE_HOURS.openHour && hour24 <= STORE_HOURS.closeHour;

// Listado de horas permitidas (12h)
export const getAllowedHours = (period: Period) =>
  Array.from({ length: 12 }, (_, i) => i + 1).filter((h12) =>
    isHourAllowed(to24Hour(h12, period)),
  );

  

// Minutos permitidos según step
export const getAllowedMinutes = (selectedHour24: number) => {
  const allMinutes = Array.from({ length: 60 / STORE_HOURS.stepMinutes }, (_, i) => 
    i * STORE_HOURS.stepMinutes
  );

  return allMinutes.filter(minute => {
    // Si es la hora de apertura, solo minutos >= a la apertura
    if (selectedHour24 === STORE_HOURS.openHour) {
      return minute >= STORE_HOURS.openMinute;
    }
    // Si es la hora de cierre, solo minutos < al cierre
    if (selectedHour24 === STORE_HOURS.closeHour) {
      return minute < STORE_HOURS.closeMinute;
    }
    // Para cualquier otra hora intermedia, todos los minutos valen
    return true;
  }).map(m => m.toString().padStart(2, "0"));
};