import { SaleRepository } from "../../../domain/tenant/repositories/SaleRepository";
import { ClientRepository } from "../../../domain/tenant/repositories/ClientRepository";
import { BranchRepository } from "../../../domain/tenant/repositories/BranchRepository";
import { InventoryRepository } from "../../../domain/tenant/repositories/InventoryRepository";
import { OperationRepository } from "../../../domain/tenant/repositories/OperationRepository";
import { UserRepository } from "../../../domain/tenant/repositories/UserRepository";
import { SaleTableRow, mapSaleToTable } from "../../../adapters/sales-table-adapter";

export class GetSalesGridUseCase {
  constructor(
    private readonly saleRepo: SaleRepository,
    private readonly clientRepo: ClientRepository,
    private readonly branchRepo: BranchRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly operationRepo: OperationRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(tenantId: string): Promise<SaleTableRow[]> {
    const [
      sales,
      saleItems,
      clients,
      branches,
      products,
      users,
      operations
    ] = await Promise.all([
      this.saleRepo.getSales(),
      this.saleRepo.getSaleItems(),
      this.clientRepo.getAllClients(),
      this.branchRepo.getBranchesByTenant(tenantId),
      this.inventoryRepo.getProducts(),
      this.userRepo.getUsers(),
      this.operationRepo.getOperationsByTenant(tenantId),
    ]);

    return mapSaleToTable(clients, sales.filter(s => s.tenantId === tenantId), saleItems, products, users, operations);
  }
}
