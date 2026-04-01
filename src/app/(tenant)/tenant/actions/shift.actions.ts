"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { revalidatePath } from "next/cache";
import { PrismaShiftRepository } from "@/src/infrastructure/tenant/repositories/PrismaShiftRepository";
import { PrismaUnitOfWork } from "@/src/infrastructure/tenant/repositories/PrismaUnitOfWork";
import { CrudShiftUseCase } from "@/src/application/tenant/use-cases/shift/crudShift.usecase";
import type { Shift, WorkingDay, ShiftAssignment } from "@/src/application/interfaces/shift/shift";

function getUseCase() {
  const repo = new PrismaShiftRepository(prisma as any);
  const uow = new PrismaUnitOfWork();
  return new CrudShiftUseCase(repo, uow);
}

async function getAuth() {
  const membership = await requireTenantMembership();
  if (!membership.tenantId) throw new Error("Tenant ID required");
  if (!membership.user?.id) throw new Error("User ID required");
  return { tenantId: membership.tenantId, userId: membership.user.id };
}

// Adapters
const DAYS_REF = ["L", "M", "X", "J", "V", "S", "D"];

function toUIDate(d?: Date | null): string {
  if (!d) return "";
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function fromUITime(timeStr: string): Date {
  const [hh, mm] = timeStr.split(":").map(Number);
  const d = new Date("1970-01-01T00:00:00Z");
  d.setUTCHours(hh, mm, 0, 0);
  return d;
}

function mapShiftToUI(s: any): Shift {
  const workingDays: WorkingDay[] = DAYS_REF.map((dayChar, i) => ({
    day: dayChar as any,
    label: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][i],
    active: s.workingDays.includes(i)
  }));

  return {
    id: s.id,
    name: s.name,
    startTime: toUIDate(s.startTime),
    endTime: toUIDate(s.endTime),
    workingDays,
    toleranceMinutes: s.toleranceMinutes,
    allowOvertime: false, // UI Specific, not saved in DB for now
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.createdAt // Using createdAt as fallback
  };
}

export async function getShiftsAction(): Promise<Shift[]> {
  const auth = await getAuth();
  const uc = getUseCase();
  const shifts = await uc.getShifts(auth.tenantId);
  return shifts.map(mapShiftToUI);
}

export async function createShiftAction(data: Shift): Promise<Shift> {
  const auth = await getAuth();
  const uc = getUseCase();

  const workingDaysIndices = data.workingDays
    .map((d, i) => d.active ? i : -1)
    .filter(i => i !== -1);

  const shift = await uc.createShift({
    name: data.name,
    startTime: fromUITime(data.startTime),
    endTime: data.endTime ? fromUITime(data.endTime) : undefined,
    toleranceMinutes: data.toleranceMinutes,
    workingDays: workingDaysIndices,
    status: data.status,
    tenantId: auth.tenantId,
    createdBy: auth.userId,
  });

  revalidatePath("/tenant/shift");
  revalidatePath("/tenant/shifts");
  return mapShiftToUI(shift);
}

export async function updateShiftAction(id: string, data: Partial<Shift>): Promise<Shift> {
  const auth = await getAuth();
  const uc = getUseCase();

  const workingDaysIndices = data.workingDays
    ? data.workingDays.map((d, i) => d.active ? i : -1).filter(i => i !== -1)
    : undefined;

  const shift = await uc.updateShift(id, auth.tenantId, {
    name: data.name,
    startTime: data.startTime ? fromUITime(data.startTime) : undefined,
    endTime: data.endTime ? fromUITime(data.endTime) : undefined,
    toleranceMinutes: data.toleranceMinutes,
    workingDays: workingDaysIndices,
    status: data.status,
  });

  revalidatePath("/tenant/shift");
  revalidatePath("/tenant/shifts");
  return mapShiftToUI(shift);
}

export async function deleteShiftAction(id: string) {
  const auth = await getAuth();
  const uc = getUseCase();
  await uc.deleteShift(id, auth.tenantId);
  revalidatePath("/tenant/shift");
  revalidatePath("/tenant/shifts");
}

export async function getShiftAssignmentsAction(shiftId: string): Promise<ShiftAssignment[]> {
  const auth = await getAuth();
  const uc = getUseCase();
  const assignments = await uc.getShiftAssignments(shiftId, auth.tenantId);
  return assignments.map(a => ({
    id: a.id,
    employeeId: a.membershipId,
    employeeName: (a as any).memberName || "Desconocido",
    shiftId: a.shiftId,
    startDate: a.startDate,
    endDate: a.endDate ?? undefined,
    status: "active" as const
  }));
}

export async function assignEmployeeToShiftAction(data: {
  shiftId: string;
  employeeId: string;
  startDate: Date;
  endDate?: Date;
}) {
  const auth = await getAuth();
  const uc = getUseCase();

  const membership = await (prisma as any).userTenantMembership.findFirst({
    where: { userId: data.employeeId, tenantId: auth.tenantId },
  });

  if (!membership) {
    throw new Error("El usuario especificado no es miembro de esta organización.");
  }

  const assignment = await uc.assignEmployeeToShift({
    shiftId: data.shiftId,
    membershipId: membership.id,
    startDate: data.startDate,
    endDate: data.endDate,
    tenantId: auth.tenantId,
    createdBy: auth.userId,
    updatedBy: auth.userId,
  });

  revalidatePath("/tenant/shift");
  revalidatePath("/tenant/shifts");
  return {
    id: assignment.id,
    employeeId: assignment.membershipId,
    employeeName: (assignment as any).memberName || "Desconocido",
    shiftId: assignment.shiftId,
    startDate: assignment.startDate,
    endDate: assignment.endDate ?? undefined,
    status: "active" as const
  } as ShiftAssignment;
}

export async function removeEmployeeFromShiftAction(assignmentId: string) {
  const auth = await getAuth();
  const uc = getUseCase();

  await uc.removeEmployeeFromShift(assignmentId, auth.tenantId);

  revalidatePath("/tenant/shift");
  revalidatePath("/tenant/shifts");
}
