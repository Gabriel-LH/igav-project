// types/branch.types.ts
import { z } from "zod";

export const branchSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  code: z.string(),
  name: z.string(),
  city: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  timezone: z.string().default("America/Lima"),
  isPrimary: z.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type Branch = z.infer<typeof branchSchema>;

// Tipos para datos relacionados
export interface BranchEmployee {
  id: string;
  branchId: string;
  employeeId: string;
  employeeName: string;
  position: string;
  assignedAt: Date;
  status: 'active' | 'inactive';
}

export interface BranchShift {
  id: string;
  branchId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  employeesCount: number;
  status: 'active' | 'inactive';
}

export interface BranchMetrics {
  branchId: string;
  monthSales: number;
  currentCash: number;
  todayAttendance: number;
  recentAttendance: Array<{
    employee: string;
    time: string;
    type: 'entry' | 'exit';
  }>;
}