// import { SaleDTO } from "@/src/interfaces/SaleDTO";
// import { processTransaction } from "../transactionServices";
// import { useSaleStore } from "@/src/store/useSaleStore";
// import { useInventoryStore } from "@/src/store/useInventoryStore";

// export function sellDirectUseCase(dto: SaleDTO) {
//   const result = processTransaction(dto);

//   const saleStore = useSaleStore.getState();
//   const inventory = useInventoryStore.getState();

//   const sale = saleStore.sales.find(
//     s => s.operationId === result.operation.id
//   );

//   if (!sale) throw new Error("Venta no creada");

//   // 🟢 entregar inmediatamente
//   saleStore.updateSale(sale.id, {
//     status: "vendido",
//     updatedAt: new Date(),
//   });

//   saleStore.saleItems
//     .filter(i => i.saleId === sale.id)
//     .forEach(item => {
//       inventory.deliverAndTransfer(
//         item.stockId,
//         "vendido",
//         sale.branchId,
//         sale.sellerId
//       );
//     });

//   return result;
// }
