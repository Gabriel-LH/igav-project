export type LoyaltyTransactionType = 
  | "earned_purchase"   // Ganado por compra
  | "redeemed"          // Canjeado por descuento
  | "manual_adjustment" // Ajuste manual
  | "bonus_referral";   // Bono extra