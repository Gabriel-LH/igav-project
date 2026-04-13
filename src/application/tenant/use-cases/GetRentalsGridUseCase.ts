import { RentalRepository } from "../../../domain/tenant/repositories/RentalRepository";
import { ClientRepository } from "../../../domain/tenant/repositories/ClientRepository";
import { BranchRepository } from "../../../domain/tenant/repositories/BranchRepository";
import { GuaranteeRepository } from "../../../domain/tenant/repositories/GuaranteeRepository";
import { InventoryRepository } from "../../../domain/tenant/repositories/InventoryRepository";
import { OperationRepository } from "../../../domain/tenant/repositories/OperationRepository";
import { UserRepository } from "../../../domain/tenant/repositories/UserRepository";
import { RentalTableRow } from "../../../adapters/rentals-active-adapters";
import { User } from "../../../types/user/type.user";
import { Operation } from "../../../types/operation/type.operations";
import { Branch } from "../../../types/branch/type.branch";
import { Client } from "../../../types/clients/type.client";
import { Guarantee } from "../../../types/guarantee/type.guarantee";
import { Product } from "../../../types/product/type.product";
import { Rental } from "../../../types/rentals/type.rentals";
import { RentalItem } from "../../../types/rentals/type.rentalsItem";

export class GetRentalsGridUseCase {
  constructor(
    private readonly rentalRepo: RentalRepository,
    private readonly clientRepo: ClientRepository,
    private readonly branchRepo: BranchRepository,
    private readonly guaranteeRepo: GuaranteeRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly operationRepo: OperationRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(tenantId: string): Promise<RentalTableRow[]> {
    const [
      rentals, 
      rentalItems, 
      clients, 
      branches, 
      guarantees, 
      products, 
      operations, 
      users
    ] = await Promise.all([
      this.rentalRepo.getRentals(),
      this.rentalRepo.getRentalItems(),
      this.clientRepo.getAllClients(),
      this.branchRepo.getBranchesByTenant(tenantId),
      this.guaranteeRepo.getGuarantees(tenantId),
      this.inventoryRepo.getProducts(),
      this.operationRepo.getOperationsByTenant(tenantId),
      this.userRepo.getUsers(),
    ]);

    const usersById = new Map<string, User>(users.map((u) => [u.id, u]));
    const sellerIdByOperationId = new Map<string, string>(operations.map((op) => [op.id, op.sellerId]));
    const branchesById = new Map<string, Branch>(branches.map((b) => [b.id, b]));
    const clientsById = new Map<string, Client>(clients.map((c) => [c.id, c]));
    const guaranteesById = new Map<string, Guarantee>(guarantees.map((g) => [g.id, g]));
    const productsById = new Map<string, Product>(products.map((p) => [p.id, p]));

    return Promise.all(
      rentals
      .filter((r: Rental) => r.tenantId === tenantId)
      .map(async (rental: Rental) => {
        const branch = branchesById.get(rental.branchId);
        const customer = clientsById.get(rental.customerId);
        const guaranteeId = rental.guaranteeId || (rental as any).guarantee_id;
        let guarantee: Guarantee | undefined;

        if (guaranteeId) {
          guarantee = guaranteesById.get(guaranteeId);
          if (!guarantee) {
            guarantee = await this.guaranteeRepo.getGuaranteeById(guaranteeId);
          }
        }
        
        if (!guarantee) {
          // Fallback por operationId si el ID directo falla
          guarantee = guarantees.find(g => g.operationId === rental.operationId);
          if (!guarantee) {
            guarantee = await this.guaranteeRepo.getGuaranteeByOperationId(
              rental.operationId,
            );
          }
        }
        
        if (!guarantee && rental.id) {
           // Último recurso: buscar en descripción si se guardó el ID de alquiler (a veces pasa en legacy)
           guarantee = guarantees.find(g => g.description?.includes(rental.id));
        }
        
        if (!guarantee) {
          guarantee = await this.guaranteeRepo.findGuaranteeForRental({
            guaranteeId: guaranteeId || undefined,
            operationId: rental.operationId,
            rentalId: rental.id,
          });
        }

        const sellerId = (rental as any).sellerId || sellerIdByOperationId.get(rental.operationId);
        const seller = sellerId ? usersById.get(sellerId) : undefined;

        const outDate = new Date(rental.outDate);
        const expectedReturnDate = new Date(rental.expectedReturnDate);
        
        // Calcular duración en días (Inclusivo, mínimo 1)
        const d1 = new Date(outDate.getFullYear(), outDate.getMonth(), outDate.getDate());
        const d2 = new Date(expectedReturnDate.getFullYear(), expectedReturnDate.getMonth(), expectedReturnDate.getDate());
        const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        const days = diffDays + 1; // Inclusivo: del 24 al 26 son 3 días (24, 25, 26)

        const currentItems = rentalItems.filter((i: RentalItem) => i.rentalId === rental.id);

        const itemsWithNames = currentItems.map((item: RentalItem) => {
          const prod = productsById.get(item.productId);
          return {
            ...item,
            productName: prod?.name || "Desconocido",
            image: prod?.image,
            sku: prod?.baseSku,
            totalItemPrice: item.priceAtMoment * days * (item.quantity || 1),
          };
        });

        const mainProductName = itemsWithNames[0]?.productName || "Sin productos";
        const distinctCount = itemsWithNames.length;
        const cleanSummary = distinctCount > 1 ? `${mainProductName} (+${distinctCount - 1} más)` : mainProductName;
        const totalItems = currentItems.reduce((acc: number, item: RentalItem) => acc + (item.quantity || 1), 0);

        const searchContent = [
          rental.id,
          customer?.firstName,
          customer?.lastName,
          customer?.dni,
          ...itemsWithNames.map((i) => i.productName),
        ].filter(Boolean).join(" ").toLowerCase();

        const op = operations.find(o => o.id === rental.operationId);

        return {
          id: rental.id,
          branchName: branch?.name || "Principal",
          sellerName: seller ? `${seller.firstName} ${seller.lastName}` : "---",
          outDate: outDate.toLocaleDateString(),
          expectedReturnDate: expectedReturnDate.toLocaleDateString(),
          cancelDate: (rental as any).cancelDate ? new Date((rental as any).cancelDate).toLocaleDateString() : "---",
          returnDate: rental.actualReturnDate ? new Date(rental.actualReturnDate).toLocaleDateString() : "---",
          nameCustomer: customer ? `${customer.firstName} ${customer.lastName}` : "---",
          summary: cleanSummary,
          totalItems,
          itemsDetail: itemsWithNames,
          product: cleanSummary,
          count: totalItems,
          rent_unit: days === 1 ? "1 Día" : `${days} Días`,
          income: currentItems.reduce((acc: number, item: RentalItem) => acc + (item.priceAtMoment * days * (item.quantity || 1)), 0) || 0,
          gurantee_type: guarantee ? guarantee.type.toString() : "---",
          gurantee_value: guarantee ? guarantee.value.toString() : "---",
          guarantee_status: guarantee?.status || "---",
          taxAmount: op?.taxAmount || 0,
          roundingAmount: op?.roundingAmount || 0,
          totalBeforeRounding: op?.totalBeforeRounding || 0,
          status: rental.status,
          damage: "---",
          searchContent,
        };
      }),
    );
  }
}
