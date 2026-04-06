"use server";

import { revalidatePath } from "next/cache";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { PrismaUnitOfWork } from "@/src/infrastructure/tenant/repositories/PrismaUnitOfWork";
import { PrismaAttendanceRepository } from "@/src/infrastructure/tenant/repositories/PrismaAttendanceRepository";
import { PrismaShiftRepository } from "@/src/infrastructure/tenant/repositories/PrismaShiftRepository";
import { RecordAttendanceUseCase } from "@/src/application/tenant/use-cases/attendance/recordAttendance.usecase";
import prisma from "@/src/lib/prisma";
import { AttendanceRecord } from "@/src/components/tenant/attendance/ui/MarkAttendanceModal";

async function checkAuth() {
  const membership = await requireTenantMembership();
  if (!membership || !membership.tenantId || !membership.user.id) {
    throw new Error("No autorizado. Inicie sesiÃ³n nuevamente.");
  }
  return {
    tenantId: membership.tenantId,
    userId: membership.user.id,
    user: membership.user,
  };
}

function getUseCases() {
  const unitOfWork = new PrismaUnitOfWork();
  const attendanceRepo = new PrismaAttendanceRepository(prisma);
  const shiftRepo = new PrismaShiftRepository(prisma);

  const recordAttendanceUC = new RecordAttendanceUseCase(
    attendanceRepo,
    shiftRepo,
    unitOfWork,
  );

  return { attendanceRepo, recordAttendanceUC };
}

type WeeklyAttendanceRecord = {
  id: string;
  userId: string;
  employeeName?: string;
  employeeDni?: string;
  workDate: Date;
  shiftName?: string;
  checkIn?: Date | null;
  checkOut?: Date | null;
  status: AttendanceRecord["status"];
  notes?: string | null;
  branchId: string;
  isManual?: boolean;
  lateMinutes?: number;
  extraMinutes?: number;
  justification?: string | null;
};

type WeeklyShiftAssignment = {
  id: string;
  employeeId: string;
  shiftId: string;
  shift: {
    name: string;
    startTime: string;
    endTime: string;
  };
  startDate: Date;
  endDate: Date | null;
};

export async function getWeeklyAttendanceAction(
  qStart: Date,
  qEnd: Date,
  branchId: string = "all",
) {
  const { tenantId } = await checkAuth();
  const { attendanceRepo } = getUseCases();

  const [recordsRaw, assignmentsRaw] = await Promise.all([
    attendanceRepo.findWeeklyRecords(tenantId, branchId, qStart, qEnd),
    prisma.userShiftAssignment.findMany({
      where: {
        tenantId,
        startDate: { lte: qEnd },
        OR: [{ endDate: { equals: null } }, { endDate: { gte: qStart } }],
      },
      include: {
        shift: { select: { name: true, startTime: true, endTime: true } },
        membership: { select: { userId: true } },
      },
    }),
  ]);

  const records = (recordsRaw as WeeklyAttendanceRecord[]).map((record) => {
    return {
      id: record.id,
      employeeId: record.userId,
      employeeName: record.employeeName,
      employeeDni: record.employeeDni,
      date: record.workDate,
      shift: record.shiftName || "custom",
      shiftId: record.shiftId || undefined,
      checkIn: record.checkIn
        ? record.checkIn.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
      checkOut: record.checkOut
        ? record.checkOut.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
      status: record.status,
      notes: record.notes || "",
      branchId: record.branchId,
      isManual: record.isManual,
      lateMinutes: record.lateMinutes,
      extraMinutes: record.extraMinutes,
      justification: record.justification || undefined,
    } as AttendanceRecord;
  });

  const assignments: WeeklyShiftAssignment[] = assignmentsRaw.map(
    (assignment) => ({
      id: assignment.id,
      employeeId: assignment.membership.userId,
      shiftId: assignment.shiftId,
      shift: {
        name: assignment.shift.name,
        startTime: assignment.shift.startTime,
        endTime: assignment.shift.endTime,
      },
      startDate: assignment.startDate,
      endDate: assignment.endDate,
    }),
  );

  return { records, assignments };
}

export async function markAttendanceAction(data: {
  employeeId: string;
  date: Date;
  checkIn?: string;
  checkOut?: string;
  shift?: string;
  shiftId?: string;
  notes?: string;
  status: string;
  lateMinutes?: number;
  extraMinutes?: number;
}) {
  const { tenantId, userId } = await checkAuth();
  const { recordAttendanceUC } = getUseCases();

  const parseTime = (timeStr?: string) => {
    if (!timeStr) return undefined;
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(data.date);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const checkInDate = parseTime(data.checkIn);
  const checkOutDate = parseTime(data.checkOut);

  const employeeMembership = await prisma.userTenantMembership.findFirst({
    where: { userId: data.employeeId, tenantId, status: "active" },
    select: { defaultBranchId: true }
  });
  const branchId = employeeMembership?.defaultBranchId;
  if (!branchId) throw new Error("El empleado no tiene sucursal asignada.");

  const result = await recordAttendanceUC.execute({
    tenantId,
    userId: data.employeeId,
    branchId: branchId,
    workDate: data.date,
    shiftId: data.shiftId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    checkInTime: data.checkIn,
    checkOutTime: data.checkOut,
    lateMinutes: data.lateMinutes,
    extraMinutes: data.extraMinutes,
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
  notes: string;
}) {
  const { tenantId, userId } = await checkAuth();
  const { recordAttendanceUC } = getUseCases();

  const employeeMembership = await prisma.userTenantMembership.findFirst({
    where: { userId: data.employeeId, tenantId, status: "active" },
    select: { defaultBranchId: true }
  });
  const branchId = employeeMembership?.defaultBranchId;
  if (!branchId) throw new Error("El empleado no tiene sucursal asignada.");

  const result = await recordAttendanceUC.justifyAbsence(
    tenantId,
    data.employeeId,
    branchId,
    data.date,
    data.justification,
    data.notes,
    userId,
  );

  revalidatePath("/tenant/attendance");
  return result;
}

export async function scanDniAction(dni: string) {
  const { tenantId, userId } = await checkAuth();
  const { recordAttendanceUC, attendanceRepo } = getUseCases();

  // Clean DNI: Remove anything that's not a letter or number (scanners often add ENTER, TAB, prefix, etc.)
  let normalizedDni = dni.trim();
  
  // If it's a complex string (like a URL or ID prefix), try to extract just the alphanumeric part at the end
  if (normalizedDni.includes("/") || normalizedDni.includes(":") || normalizedDni.length > 15) {
    const segments = normalizedDni.split(/[/:]/);
    const lastSegment = segments[segments.length - 1].replace(/[^a-zA-Z0-9]/g, "");
    if (lastSegment.length >= 4) {
      normalizedDni = lastSegment;
    } else {
      normalizedDni = normalizedDni.replace(/[^a-zA-Z0-9]/g, "");
    }
  } else {
    normalizedDni = normalizedDni.replace(/[^a-zA-Z0-9]/g, "");
  }

  // Final check: if it's very long, try to find an 8-digit Peruvian DNI sequence
  if (normalizedDni.length > 12) {
    const dnimatch = normalizedDni.match(/\d{8}/);
    if (dnimatch) normalizedDni = dnimatch[0];
  }
  
  if (!normalizedDni) {
    throw new Error(`El código escaneado (${dni}) no contiene un identificador válido.`);
  }

  const employee = await prisma.user.findFirst({
    where: {
      dni: normalizedDni,
      userTenantMemberships: {
        some: {
          tenantId,
          status: "active",
        },
      },
    },
    select: {
      id: true,
      name: true,
      dni: true,
      userTenantMemberships: {
        where: {
          tenantId,
          status: "active",
        },
        select: {
          defaultBranchId: true,
        },
        take: 1,
      },
    },
  });

  if (!employee) {
    throw new Error(`No se encontró un empleado activo con el DNI o Código: "${normalizedDni}". Asegúrese de que el DNI esté registrado correctamente en el equipo.`);
  }

  const now = new Date();
  const existing = await attendanceRepo.findByEmployeeAndDate(
    tenantId,
    employee.id,
    now,
  );

  const checkIn = existing?.checkIn ? existing.checkIn : now;
  const checkOut = existing?.checkIn ? now : undefined;

  // UNIFICACIÓN V15: Usamos resta manual de 5 horas (UTC -> Lima) para el escáner
  const peruArrival = new Date(checkIn.getTime() - 5 * 60 * 60 * 1000);
  const arrivalTimeStr = `${peruArrival.getUTCHours().toString().padStart(2, '0')}:${peruArrival.getUTCMinutes().toString().padStart(2, '0')}`;

  const peruDeparture = checkOut ? new Date(checkOut.getTime() - 5 * 60 * 60 * 1000) : undefined;
  const departureTimeStr = peruDeparture 
    ? `${peruDeparture.getUTCHours().toString().padStart(2, '0')}:${peruDeparture.getUTCMinutes().toString().padStart(2, '0')}`
    : undefined;

  // CÁLCULO DE BLINDAJE (V16.1): Calculamos la tardanza aquí para forzarla en el caso de uso
  let calculatedLateMinutes = 0;
  if (!existing && arrivalTimeStr) { 
    // Solo para entrada inicial
    const [arrH, arrM] = arrivalTimeStr.split(":").map(Number);
    const arrTotal = arrH * 60 + arrM;
    
    // Obtenemos el turno asignado para este día
    const assignment = await prisma.userShiftAssignment.findFirst({
      where: {
        userId: employee.id,
        tenantId,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }]
      },
      include: { shift: true }
    });

    const shift = assignment?.shift;
    if (shift) {
      // Usamos el mapa nominal para mayor seguridad
      const SHIFT_MAP: Record<string, number> = { "mañana": 8, "tarde": 14, "noche": 22 };
      const sName = shift.name.toLowerCase();
      let sH = (shift.startTime.getUTCHours() + 5) % 24; // Recuperar Lima de DB

      for (const [k, v] of Object.entries(SHIFT_MAP)) {
        if (sName.includes(k)) { sH = v; break; }
      }

      const shiftTotal = sH * 60;
      if (arrTotal > shiftTotal + shift.toleranceMinutes) {
        calculatedLateMinutes = arrTotal - shiftTotal;
      }
    }
  }

  try {
    const result = await recordAttendanceUC.execute({
      tenantId,
      userId: employee.id,
      branchId: employee.userTenantMemberships[0]?.defaultBranchId ?? "all",
      workDate: now,
      checkIn,
      checkOut,
      checkInTime: arrivalTimeStr,
      checkOutTime: departureTimeStr,
      lateMinutes: calculatedLateMinutes > 0 ? calculatedLateMinutes : undefined,
      status: calculatedLateMinutes > 0 ? "late" : "present",
      isManual: false,
      source: "dni-scanner",
      createdBy: userId,
    });

    const normalizedResult = result as AttendanceRecord & {
      employeeName?: string;
      employeeDni?: string;
      shiftName?: string;
    };

    revalidatePath("/tenant/attendance");

    return {
      employeeName: employee.name,
      record: {
        ...normalizedResult,
        employeeName: normalizedResult.employeeName || employee.name,
        employeeDni:
          normalizedResult.employeeDni || employee.dni || normalizedDni,
        shift: normalizedResult.shiftName || "custom",
      },
    };
  } catch (error: unknown) {
    console.error("Scan error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Error al procesar la asistencia con el escÃ¡ner",
    );
  }
}
