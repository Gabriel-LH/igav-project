import { Product } from "../types/payments/type.product";

export const MOCK_DATA: Product[] = [
  {
    id: 1,
    name: "Vestido de Noche Gala",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=400",
    sku: "SKU-001",
    category: "Vestidos",
    description: "Vestido elegante con acabados en seda, ideal para eventos de gala.",
    condition: "Nuevo",
    status: "disponible",
    can_rent: true,
    can_sell: true,
    price_rent: 85,
    rent_unit: "evento",
    price_sell: 250,
    total_stock_global: 8,
    inventory: [
      {
        size: "S",
        color: "Negro",
        colorHex: "#000000",
        locations: [
          { branchId: "branch-001", branchName: "Sucursal Centro", quantity: 2 }
        ]
      },
      {
        size: "M",
        color: "Negro",
        colorHex: "#000000",
        locations: [
          { branchId: "branch-001", branchName: "Sucursal Centro", quantity: 5 }
        ]
      },
      {
        size: "L",
        color: "Vino",
        colorHex: "#800020",
        locations: [
          { branchId: "branch-002", branchName: "Sucursal Norte", quantity: 1 }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Tuxedo Slim Fit",
    image: "https://m.media-amazon.com/images/I/610HVuZJefL._AC_SX569_.jpg",
    sku: "SKU-002",
    category: "Trajes",
    description: "Corte moderno ajustado, incluye saco y pantalón.",
    condition: "Nuevo",
    status: "disponible",
    can_rent: true,
    can_sell: false,
    price_rent: 120,
    rent_unit: "día",
    total_stock_global: 5,
    inventory: [
      {
        size: "L",
        color: "Azul Marino",
        colorHex: "#000080",
        locations: [
          { branchId: "branch-001", branchName: "Sucursal Centro", quantity: 3 }
        ]
      },
      {
        size: "M",
        color: "Azul Marino",
        colorHex: "#000080",
        locations: [
          { branchId: "branch-003", branchName: "Sucursal Sur", quantity: 2 }
        ]
      }
    ]
  },
  {
    id: 3,
    name: "Traje Clásico",
    image: "https://m.media-amazon.com/images/I/51oBfmmnrdL._AC_SX342_.jpg",
    sku: "SKU-003",
    category: "Trajes",
    description: "Traje clásico de corte recto, ideal para eventos formales.",
    condition: "Nuevo",
    status: "disponible",
    can_rent: true,
    can_sell: true,
    price_rent: 100,
    rent_unit: "día",
    price_sell: 450,
    total_stock_global: 7,
    inventory: [
      {
        size: "M",
        color: "Negro",
        colorHex: "#000000",
        locations: [
          { branchId: "branch-001", branchName: "Sucursal Centro", quantity: 4 }
        ]
      },
      {
        size: "L",
        color: "Negro",
        colorHex: "#000000",
        locations: [
          { branchId: "branch-002", branchName: "Sucursal Norte", quantity: 2 }
        ]
      },
      {
        size: "XL",
        color: "Negro",
        colorHex: "#000000",
        locations: [
          { branchId: "branch-003", branchName: "Sucursal Sur", quantity: 1 }
        ]
      }
    ]
  }
];
