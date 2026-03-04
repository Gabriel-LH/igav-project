import { PaymentMethod } from "../types/payments/type.paymetMethod";

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm1",
    name: "Efectivo",
    type: "cash",
    active: true,
    allowsChange: true,
    requiresPin: false,
    icon: "💰",
  },
  {
    id: "pm2",
    name: "Yape",
    type: "digital",
    active: true,
    allowsChange: false,
    requiresPin: false,
    icon: "📱",
  },
  {
    id: "pm3",
    name: "Visa",
    type: "card",
    active: true,
    allowsChange: false,
    requiresPin: true,
    icon: "💳",
  },
  {
    id: "pm4",
    name: "Mastercard",
    type: "card",
    active: true,
    allowsChange: false,
    requiresPin: true,
    icon: "💳",
  },
  {
    id: "pm5",
    name: "Plin",
    type: "digital",
    active: false,
    allowsChange: false,
    requiresPin: false,
    icon: "📱",
  },
];
