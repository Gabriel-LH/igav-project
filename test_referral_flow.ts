/*
// test_referral_flow.ts
import { useCustomerStore } from "./src/store/useCustomerStore";
import { useReferralStore } from "./src/store/useReferralStore";
import { useCreateClientWithReferral } from "./src/services/use-cases/createReferral";
import { processTransaction } from "./src/services/transactionServices";

async function test() {
  const { create } = useCreateClientWithReferral();

  // The referrer
  const juan = useCustomerStore.getState().getCustomerById("cl_001");
  console.log("INITIAL REFERRER POINTS (JUAN):", juan?.loyaltyPoints);

  // 1. Create client
  const newClient = create({
    dni: "88888888",
    firstName: "TestNew",
    lastName: "User",
    phone: "999999999",
    address: "test",
    city: "test",
    usedReferralCode: "YAL5T3", // Juan's code
  });

  console.log("CREATED CLIENT:", newClient.id);
  console.log("INITIAL NEW CLIENT POINTS:", newClient.loyaltyPoints);

  const pendingRef = useReferralStore
    .getState()
    .referrals.find((r) => r.referredClientId === newClient.id);
  console.log(
    "PENDING REFERRAL FOUND?:",
    pendingRef?.status,
    "REFERRER:",
    pendingRef?.referrerClientId,
  );

  // 2. Make purchase
  try {
    const saleData: any = {
      id: "",
      operationId: "",
      type: "venta",
      status: "completado",
      saleDate: new Date(),
      items: [
        {
          productId: "prod_1",
          quantity: 1,
          unitPrice: 1500,
          subtotal: 1500,
          operationType: "venta",
        },
      ],
      financials: {
        totalAmount: 1500,
        receivedAmount: 1500,
        paymentMethod: "cash",
      },
      customerId: newClient.id,
      branchId: "branch_1",
      sellerId: "seller_1",
    };

    await processTransaction(saleData);
  } catch (e: any) {
    console.log(
      "Error in transaction (expected if missing dependencies):",
      e.message,
    );
  }

  // 3. Print final points
  const finalJuan = useCustomerStore.getState().getCustomerById("cl_001");
  const finalNewClient = useCustomerStore
    .getState()
    .getCustomerById(newClient.id);
  console.log("FINAL REFERRER POINTS (JUAN):", finalJuan?.loyaltyPoints); // Should be 100 (from processReferrals)
  console.log("FINAL NEW CLIENT POINTS:", finalNewClient?.loyaltyPoints); // Should be 150 (from 1500/10 purchase points)
}

test();
*/
