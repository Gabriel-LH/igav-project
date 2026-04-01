import { ShiftRepository, CreateShiftDTO, UpdateShiftDTO, CreateShiftAssignmentDTO } from "@/src/domain/tenant/repositories/ShiftRepository";
import { IUnitOfWork } from "@/src/domain/tenant/repositories/IUnitOfWork";

export class CrudShiftUseCase {
  constructor(
    private readonly shiftRepository: ShiftRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async getShifts(tenantId: string) {
    return await this.shiftRepository.findAll(tenantId);
  }

  async getShiftById(id: string, tenantId: string) {
    return await this.shiftRepository.findById(id, tenantId);
  }

  async createShift(dto: CreateShiftDTO) {
    // Validations could go here
    if (!dto.name || dto.name.trim() === "") throw new Error("El nombre es requerido");
    if (!dto.startTime) throw new Error("La hora de inicio es requerida");
    if (!dto.workingDays || dto.workingDays.length === 0) throw new Error("Al menos un día laborable es requerido");

    return await this.unitOfWork.execute(async () => {
      return await this.shiftRepository.create(dto);
    });
  }

  async updateShift(id: string, tenantId: string, dto: UpdateShiftDTO) {
    // Check exists
    const existing = await this.shiftRepository.findById(id, tenantId);
    if (!existing) throw new Error("El turno no existe");

    return await this.unitOfWork.execute(async () => {
      return await this.shiftRepository.update(id, tenantId, dto);
    });
  }

  async deleteShift(id: string, tenantId: string) {
    const existing = await this.shiftRepository.findById(id, tenantId);
    if (!existing) throw new Error("El turno no existe");

    return await this.unitOfWork.execute(async () => {
      await this.shiftRepository.delete(id, tenantId);
    });
  }

  async getShiftAssignments(shiftId: string, tenantId: string) {
    return await this.shiftRepository.findAssignmentsByShiftId(shiftId, tenantId);
  }

  async assignEmployeeToShift(dto: CreateShiftAssignmentDTO) {
    if (!dto.startDate) throw new Error("Fecha de inicio requerida");
    if (dto.endDate && new Date(dto.startDate) > new Date(dto.endDate)) throw new Error("Fecha de inicio no puede ser posterior al fin");

    return await this.unitOfWork.execute(async () => {
      return await this.shiftRepository.createAssignment(dto);
    });
  }

  async removeEmployeeFromShift(id: string, tenantId: string) {
    return await this.unitOfWork.execute(async () => {
      await this.shiftRepository.deleteAssignment(id, tenantId);
    });
  }
}
