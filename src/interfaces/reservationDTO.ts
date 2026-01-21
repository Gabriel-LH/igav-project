export type OperationType = "alquiler" | "venta" | "reserva";
export type ReservationStatus = 
  | "pendiente" | "confirmada" | "cancelada" | "completada" // Reservation
  | "en_curso" | "devuelto" | "atrasado"                   // Rental
  | "vendido" | "disponible";                              // Stock / Sale

export interface ReservationDTO {
  stockId: string; // Lo genera la DB o el Store
  productId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  type: OperationType;
  status: ReservationStatus;
  
  // Fechas en formato ISO o Date
  startDate: Date;
  endDate: Date;
  
  customerId: string;
  customerName: string;
  sellerId: string;
  quantity: number;
  notes: string;
  branchId: string;

  financials: {
    total: number;
    downPayment: number;
    pendingAmount: number;
    paymentMethod: "cash" | "card" | "transfer" | "yape" | "plin";
    guarantee: {
      type: "dinero" | "dni" | "joyas" | "reloj" | "otros" | "no_aplica";
      value?: string;
      description?: string;
    };
  };
  createdAt: Date;
}