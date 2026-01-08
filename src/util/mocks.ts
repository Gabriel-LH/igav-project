import { Payment } from "../components/home/type.payments";
import { Reservation } from "../components/home/type.reservation";


export const MOCK_DATA = [
  {
    id: 1,
    name: "Vestido de Noche Gala",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=400",
    category: "Vestidos",
    description: "Vestido elegante con acabados en seda, ideal para eventos de gala.",
    condition: "Nuevo",
    sku: "SKU-001",
    status: "disponible",
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Negro", hex: "#000000" },
      { name: "Vino", hex: "#800020" },
      { name: "Esmeralda", hex: "#046307" }
    ],
    inventory: [
      { size: "S", color: "Negro", stock: 2, other_branch_store: true },
      { size: "M", color: "Negro", stock: 5, other_branch_store: false },
      { size: "L", color: "Vino", stock: 1, other_branch_store: true },
      { size: "M", color: "Esmeralda", stock: 0, other_branch_store: false }, // Sin stock
    ],
    total_stock: 8,
    can_rent: true,
    can_sell: true,
    is_reserved: false,
    price_rent: 85,
    rent_unit: "evento",
    price_sell: 250,
  },
  {
    id: 2,
    name: "Tuxedo Slim Fit",
    image: "https://m.media-amazon.com/images/I/610HVuZJefL._AC_SX569_.jpg",
    category: "Trajes",
    description: "Corte moderno ajustado, incluye saco y pantalón.",
    condition: "Nuevo",
    sku: "SKU-002",
    status: "disponible",
    sizes: ["L", "M", "S"],
    colors: [
      { name: "Azul Marino", hex: "#000080" },
      { name: "Gris Oxford", hex: "#373d42" }
    ],
    inventory: [
      { size: "L", color: "Azul Marino", stock: 3, other_branch_store: true },
      { size: "M", color: "Azul Marino", stock: 2, other_branch_store: false },
    ],
    total_stock: 5,
    can_rent: true,
    can_sell: false,
    is_reserved: false,
    price_rent: 120,
    rent_unit: "día",
    price_sell: 0,
  }
];

export const RESERVATIONS_MOCK: Reservation[] = [
  {
    id: "RES-001",
    productId: 4,
    customerName: "Maria Garcia",
    startDate: new Date(2026, 0, 15),
    endDate: new Date(2026, 0, 18),
    status: "confirmada",
    details: {
      quantity: 1,
      size: "S",        // Dato vital para ropa
      color: "Negro",   // Dato vital para ropa
      notes: "Ajustar basta 2cm",
    },
    createdAt: new Date(2026, 0, 1),
    totalAmount: 85,
  },
  {
    id: "RES-002",
    productId: 2,
    customerName: "Jorge Baus",
    startDate: new Date(2026, 0, 12),
    endDate: new Date(2026, 0, 15),
    status: "pendiente",
    details: {
      size: "L",
      quantity: 1,
      color: "Azul Marino",
      notes: "Bordado con logo de la empresa en el pecho.",
    },
    createdAt: new Date(2026, 0, 5),
    totalAmount: 450,
  },
  {
    id: "RES-003",
    productId: 3,
    customerName: "Eventos Globales",
    startDate: new Date(2026, 0, 5),
    endDate: new Date(2026, 0, 7),
    status: "finalizada",
    details: {
      quantity: 2,
      notes: "Entrega nocturna programada.",
    },
    createdAt: new Date(2025, 11, 28),
    totalAmount: 1200,
  }
];



export const OPERATIONS_MOCK = [
  {
    id: 501,
    productId: 2, // El mismo ID de la excavadora
    type: "reserva", // Aquí registramos el adelanto
    quantity: 1,
    total: 500,      // Este es el monto del ADELANTO
    customer: "Constructora del Norte S.A.",
    date: new Date(2026, 0, 1), // Pagó el 1 de enero para reservar
  },
  // Cuando el cliente venga el 10 de enero a recogerlo, crearás esta:
  {
    id: 502,
    productId: 1,
    type: "alquiler", // Liquidación del alquiler
    quantity: 1,
    total: 2000,     // El resto del dinero
    customer: "Constructora del Norte S.A.",
    date: new Date(2026, 0, 10),
  }
];

export const PAYMENTS_MOCK: Payment[] = [
  {
    id: "PAY-001",
    operationId: 501, 
    amount: 300,
    method: "transferencia",
    reference: "TX-99281",
    date: new Date(2026, 0, 1),
    receivedBy: "Admin Juan",
  },
  {
    id: "PAY-002",
    operationId: 501,
    amount: 200,
    method: "efectivo",
    date: new Date(2026, 0, 5),
    receivedBy: "Admin Juan",
  }
];