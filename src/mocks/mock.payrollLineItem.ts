import { PayrollLineItem } from "../types/payroll/type.payrollLineItem";

export const PAYROLL_LINE_ITEMS_MOCK: PayrollLineItem[] = [
  { id: "pli-1", payrollItemId: "pi-1", type: "earning", category: "salary", name: "Sueldo base", amount: 3200, createdAt: new Date("2026-02-28") },
  { id: "pli-2", payrollItemId: "pi-1", type: "earning", category: "overtime", name: "Horas extra", amount: 130, quantity: 5, rate: 26, createdAt: new Date("2026-02-28") },
  { id: "pli-3", payrollItemId: "pi-1", type: "deduction", category: "health_insurance", name: "Seguro de salud", amount: 160, createdAt: new Date("2026-02-28") },
  { id: "pli-4", payrollItemId: "pi-1", type: "deduction", category: "pension", name: "Pensión", amount: 320, createdAt: new Date("2026-02-28") },
  { id: "pli-5", payrollItemId: "pi-1", type: "deduction", category: "tax", name: "Impuesto", amount: 240, createdAt: new Date("2026-02-28") },
  { id: "pli-6", payrollItemId: "pi-1", type: "deduction", category: "adjustment", name: "Ajuste", amount: 22.5, createdAt: new Date("2026-02-28") },

  { id: "pli-7", payrollItemId: "pi-2", type: "earning", category: "salary", name: "Sueldo base", amount: 2800, createdAt: new Date("2026-02-28") },
  { id: "pli-8", payrollItemId: "pi-2", type: "deduction", category: "health_insurance", name: "Seguro de salud", amount: 140, createdAt: new Date("2026-02-28") },
  { id: "pli-9", payrollItemId: "pi-2", type: "deduction", category: "pension", name: "Pensión", amount: 280, createdAt: new Date("2026-02-28") },
  { id: "pli-10", payrollItemId: "pi-2", type: "deduction", category: "tax", name: "Impuesto", amount: 210, createdAt: new Date("2026-02-28") },

  { id: "pli-11", payrollItemId: "pi-3", type: "earning", category: "hourly", name: "Horas regulares", amount: 4200, quantity: 168, rate: 25, createdAt: new Date("2026-02-28") },
  { id: "pli-12", payrollItemId: "pi-3", type: "earning", category: "overtime", name: "Horas extra", amount: 300, quantity: 8, rate: 37.5, createdAt: new Date("2026-02-28") },
  { id: "pli-13", payrollItemId: "pi-3", type: "deduction", category: "health_insurance", name: "Seguro de salud", amount: 225, createdAt: new Date("2026-02-28") },
  { id: "pli-14", payrollItemId: "pi-3", type: "deduction", category: "pension", name: "Pensión", amount: 450, createdAt: new Date("2026-02-28") },
  { id: "pli-15", payrollItemId: "pi-3", type: "deduction", category: "tax", name: "Impuesto", amount: 337.5, createdAt: new Date("2026-02-28") },
  { id: "pli-16", payrollItemId: "pi-3", type: "deduction", category: "advance", name: "Adelanto", amount: 22.5, createdAt: new Date("2026-02-28") },

  { id: "pli-17", payrollItemId: "pi-4", type: "earning", category: "hourly", name: "Horas regulares", amount: 3168, quantity: 176, rate: 18, createdAt: new Date("2026-02-28") },
  { id: "pli-18", payrollItemId: "pi-4", type: "earning", category: "overtime", name: "Horas extra", amount: 153, quantity: 6, rate: 25.5, createdAt: new Date("2026-02-28") },
  { id: "pli-19", payrollItemId: "pi-4", type: "deduction", category: "health_insurance", name: "Seguro de salud", amount: 166.05, createdAt: new Date("2026-02-28") },
  { id: "pli-20", payrollItemId: "pi-4", type: "deduction", category: "pension", name: "Pensión", amount: 332.1, createdAt: new Date("2026-02-28") },
  { id: "pli-21", payrollItemId: "pi-4", type: "deduction", category: "tax", name: "Impuesto", amount: 249.075, createdAt: new Date("2026-02-28") },
  { id: "pli-22", payrollItemId: "pi-4", type: "deduction", category: "penalty", name: "Penalidad", amount: 9.725, createdAt: new Date("2026-02-28") },
];
