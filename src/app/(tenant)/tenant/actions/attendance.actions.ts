"use server";

import { revalidatePath } from "next/cache";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { PrismaUnitOfWork } from "@/src/infrastructure/tenant/repositories/PrismaUnitOfWork";
import { PrismaAttendanceRepository } from "@/src/infrastructure/tenant/repositories/PrismaAttendanceRepository";
import { PrismaShiftRepository } from "@/src/infrastructure/tenant/repositories/PrismaShiftRepository";
import { RecordAttendanceUseCase } from "@/src/application/tenant/use-cases/attendance/recordAttendance.usecase";
import prisma from "@/src/lib/prisma";
import { AttendanceRecord } from "@/src/components/tenant/attendance/ui/MarkAttendanceModal";

// Helper to check user auth
async function checkAuth() {
  const membership = await requireTenantMembership();
  if (!membership || !membership.tenantId || !membership.user.id) {
    throw new Error("No autorizado. Inicie sesión nuevamente.");
  }
  return { tenantId: membership.tenantId, userId: membership.user.id, user: membership.user };
}

// Instantiate Use Cases securely
function getUseCases() {
  const unitOfWork = new PrismaUnitOfWork();
  const attendanceRepo = new PrismaAttendanceRepository(prisma);
  const shiftRepo = new PrismaShiftRepository(prisma);

  const recordAttendanceUC = new RecordAttendanceUseCase(
    attendanceRepo,
    shiftRepo,
    unitOfWork
  );

  return { attendanceRepo, recordAttendanceUC };
}

// ----------------------------------------------------------------------
// ACTIONS
// ----------------------------------------------------------------------

export async function getWeeklyAttendanceAction(startDate: Date, endDate: Date, branchId: string = "all") {
  const { tenantId } = await checkAuth();
  const { attendanceRepo } = getUseCases();

  const records = await attendanceRepo.findWeeklyRecords(tenantId, branchId, startDate, endDate);
  
  return records.map((r: any) => {
    return {
      id: r.id,
      employeeId: r.userId,
      employeeName: r.employeeName,
      employeeDni: r.employeeDni,
      date: r.workDate,
      shift: "custom", 
      checkIn: r.checkIn ? r.checkIn.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : undefined,
      checkOut: r.checkOut ? r.checkOut.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : undefined,
      status: r.status,
      notes: r.notes || "",
      branchId: r.branchId,
      isManual: r.isManual,
      lateMinutes: r.lateMinutes,
      extraMinutes: r.extraMinutes,
      justification: r.justification || undefined,
    } as AttendanceRecord;
  });
}

export async function markAttendanceAction(data: {
  employeeId: string;
  date: Date;
  checkIn?: string;
  checkOut?: string;
  shift?: string;
  notes?: string;
  status: string;
}) {
  const { tenantId, userId } = await checkAuth();
  const { recordAttendanceUC } = getUseCases();

  const parseTime = (timeStr?: string) => {
    if (!timeStr) return undefined;
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date(data.date);
    date.setHours(h, m, 0, 0);
    return date;
  };

  const checkInDate = parseTime(data.checkIn);
  const checkOutDate = parseTime(data.checkOut);

  const result = await recordAttendanceUC.execute({
    tenantId,
    userId: data.employeeId,
    branchId: "all",
    workDate: data.date,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    notes: data.notes,
    status: data.status,
    isManual: true,
    source: "manual-ui",
    createdBy: userId,
  });

  revalidatePath("/tenant/attendance");
  return result;
}

export async function justifyAbsenceAction(data: {
  employeeId: string;
  date: Date;
  justification: string;
}) {
  const { tenantId, userId } = await checkAuth();
  const { recordAttendanceUC } = getUseCases();

  const result = await recordAttendanceUC.justifyAbsence(
    tenantId,
    data.employeeId,
    data.date,
    data.justification,
    userId
  );

  revalidatePath("/tenant/attendance");
  return result;
}

export async function scanDniAction(dni: string) {
  const { tenantId, userId } = await checkAuth();
  const { recordAttendanceUC } = getUseCases();

  // Find User by DNI (since User table has no dni, we assume DNI was matched with ID in the frontend scanner)
  const employee = await prisma.user.findFirst({
    where: { id: dni }
  });

  if (!employee) {
    throw new Error("Empleado no encontrado con el DNI proporcionado");
  }

  const now = new Date();
  
  const { attendanceRepo } = getUseCases();
  const existing = await attendanceRepo.findByEmployeeAndDate(tenantId, employee.id, now);
  
  let checkInDate = existing?.checkIn ? existing.checkIn : now;
  let checkOutDate = existing?.checkIn ? now : undefined;
  
  const result = await recordAttendanceUC.execute({
    tenantId,
    userId: employee.id,
    branchId: "all",
    workDate: now,
    checkIn: checkInDate || undefined,
    checkOut: checkOutDate || undefined,
    status: "present",
    isManual: false,
    source: "dni-scanner",
    createdBy: userId,
  });

  revalidatePath("/tenant/attendance");
  return { employeeName: employee.name, record: result };
}
