// import { BRANCH_MOCKS } from "../mocks/mock.branch";
// import { USER_MOCK } from "../mocks/mock.user";
// import { Client } from "../types/clients/type.client";
// import { Guarantee } from "../types/guarantee/type.guarantee";
// import { Operation } from "../types/operation/type.operations";
// import { Payment } from "../types/payments/type.payments";
// import { Product } from "../types/product/type.product";
// import { Rental } from "../types/rentals/type.rentals";
// import { RentalItem } from "../types/rentals/type.rentalsItem";
// import { generateProductsSummary } from "../utils/generateProductsSummary";

// // Este es el tipo que tu tabla espera (el que definiste en Zod)
// export interface PaymentTableRow {
//    id: string,
//    clientName: string,
//    operationType: string,
//    receivedBy: string,
//    amount: number,
//    date: Date,
//    paid: number,
//    balance: number,
//    method: string,
//    status: string,
//    reference: string,
//    notes: string,
// }

// export const mapPaymentsToTable = (payments: Payment[], clients: Client[], operations: Operation[]): PaymentTableRow[] => {
//   return payments.map((payment) => {

//     const client = clients.find((client) => client.id === payment.clientId);
//     const operation = operations.find((operation) => operation.id === payment.operationId);

//     const searchContent = [
//       payment.id,
//       client?.firstName + " " + client?.lastName,
//       operation?.type,
//       payment.receivedBy,
//       payment.amount,
//       payment.date,
//       payment.paid,
//       payment.balance,
//       payment.method,
//       payment.status,
//       payment.reference,
//       payment.notes,
//     ]
//       .filter(Boolean)
//       .join(" ")
//       .toLowerCase();

//     return {
//       id: customer.id,
//       userName: `${customer.firstName} ${customer.lastName}`,
//       firstName: customer.firstName,
//       lastName: customer.lastName,
//       dni: customer.dni,
//       email: customer.email,
//       phone: customer.phone,
//       address: customer.address,
//       city: customer.city,
//       province: customer.province,
//       zipCode: customer.zipCode,
//       walletBalance: customer.walletBalance,
//       loyaltyPoints: customer.loyaltyPoints,
//       createdAt: customer.createdAt,
//       updatedAt: customer.updatedAt,
//       deletedAt: customer.deletedAt,
//       status: customer.status,
//       searchContent,
//     };
//   });
// };
