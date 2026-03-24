import { Client } from "../types/clients/type.client";
import { Guarantee } from "../types/guarantee/type.guarantee";
import { Product } from "../types/product/type.product";
import { Rental } from "../types/rentals/type.rentals";
import { RentalItem } from "../types/rentals/type.rentalsItem";
import { User } from "../types/user/type.user";

export interface RentalTableRow {
  id: string;
  branchName: string;
  sellerName: string;
  outDate: string;
  expectedReturnDate: string;
  cancelDate: string;
  nameCustomer: string;
  summary: string;
  totalItems: number;
  itemsDetail: RentalItem[];
  product: string;
  count: number;
  rent_unit: string;
  income: number;
  gurantee_type: string;
  gurantee_value: string;
  guarantee_status: string;
  status: string;
  damage: string;
  returnDate: string;
  searchContent: string;
}

export const mapRentalToTable = (
  customers: Client[],
  rentals: Rental[],
  guarantees: Guarantee[],
  rentalItems: RentalItem[],
  products: Product[],
  users: User[],
): RentalTableRow[] => {
  const usersById = new Map(users.map((user) => [user.id, user]));

  return rentals.map((rental) => {
    const branchName = "Principal"; // Fallback to Principal
    const customer = customers.find((c) => c.id === rental.customerId);
    const guarantee = guarantees.find((g) => g.id === rental.guaranteeId);
    
    // Fallback if sellerId is not directly on rental (though it should be in real data)
    const seller = usersById.get((rental as any).sellerId) || users[0];

    const currentItems = rentalItems.filter((r) => r.rentalId === rental.id);

    const itemsWithNames = currentItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        ...item,
        productName: prod?.name || "Desconocido",
        image: prod?.image,
        sku: prod?.baseSku,
      };
    });

    const mainProductName = itemsWithNames[0]?.productName || "Sin productos";
    const distinctCount = itemsWithNames.length;
    const cleanSummary = distinctCount > 1 ? `${mainProductName} (+${distinctCount - 1} más)` : mainProductName;
    const totalItems = currentItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

    const searchContent = [
      rental.id,
      customer?.firstName,
      customer?.lastName,
      customer?.dni,
      ...itemsWithNames.map((i) => i.productName),
    ].filter(Boolean).join(" ").toLowerCase();

    return {
      id: rental.id,
      branchName,
      sellerName: seller ? `${seller.firstName} ${seller.lastName}` : "---",
      outDate: rental.outDate ? new Date(rental.outDate).toLocaleDateString() : "---",
      expectedReturnDate: rental.expectedReturnDate ? new Date(rental.expectedReturnDate).toLocaleDateString() : "---",
      cancelDate: rental.cancelDate ? new Date(rental.cancelDate).toLocaleDateString() : "---",
      returnDate: rental.actualReturnDate ? new Date(rental.actualReturnDate).toLocaleDateString() : "---",
      nameCustomer: customer ? `${customer.firstName} ${customer.lastName}` : "---",
      summary: cleanSummary,
      totalItems,
      itemsDetail: itemsWithNames,
      product: cleanSummary,
      count: totalItems,
      rent_unit: "Días",
      income: currentItems.reduce((acc, item) => acc + item.priceAtMoment, 0) || 0,
      gurantee_type: guarantee ? guarantee.type.toString() : "---",
      gurantee_value: guarantee ? guarantee.value.toString() : "---",
      guarantee_status: guarantee?.status || "---",
      status: rental.status,
      damage: "---",
      searchContent,
    };
  });
};
