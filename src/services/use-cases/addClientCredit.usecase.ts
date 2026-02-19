// src/services/client/addClientCredit.ts
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { useClientCreditStore } from "@/src/store/useClientCreditStore";
import { ClientCreditLedger } from "@/src/types/clients/type.clientCreditLedger"; // Asegura importar el tipo

export const addClientCredit = (
  clientId: string,
  amount: number,
  reason: "overpayment" | "manual_adjustment" | "refund", // Tipar esto fuerte
  operationId?: string, // Opcional, para saber de qué venta vino
) => {
  // 1. Validaciones
  if (amount <= 0) return; // O lanzar error, pero en pagos automáticos mejor ignorar

  // 2. Orquestación (Ledger - Historial)
  const newEntry: ClientCreditLedger = {
    id: `CCL-${crypto.randomUUID().slice(0, 8)}`, // Generamos ID aquí
    clientId,
    amount,
    reason,
    operationId,
    createdAt: new Date(),
    // paymentId? si lo tuvieras en el schema
  };

  useClientCreditStore.getState().addEntry(newEntry);

  // 3. Actualización de Estado (Snapshot - Saldo Actual)
  // Buscamos al cliente actual para sumar lo que ya tenía
  const customer = useCustomerStore.getState().getCustomerById(clientId);
  const currentBalance = customer?.walletBalance || 0;

  useCustomerStore.getState().updateCustomer(clientId, {
    walletBalance: currentBalance + amount,
  });

  console.log(
    `Crédito agregado: ${amount}. Nuevo saldo: ${currentBalance + amount}`,
  );
};
