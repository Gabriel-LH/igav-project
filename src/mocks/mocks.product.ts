import { Product } from "../types/product/type.product";

export const PRODUCTS_MOCK: Product[] = [
  {
    id: "1",
    name: "Vestido de Noche Gala",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=400",
    sku: "SKU-001",
    category: "Vestidos",
    description: "Vestido elegante con acabados en seda, ideal para eventos de gala.",
    can_rent: true,
    can_sell: true,
    is_serial: false,
    price_rent: 85,
    rent_unit: "evento",
    price_sell: 250,
  },
  {
    id: "2",
    name: "Tuxedo Slim Fit",
    image: "https://m.media-amazon.com/images/I/610HVuZJefL._AC_SX569_.jpg",
    sku: "SKU-002",
    category: "Trajes",
    description: "Corte moderno ajustado, incluye saco y pantalón.",
    can_rent: true,
    can_sell: false,
    is_serial: false,
    price_rent: 120,
    rent_unit: "día",
  },
    {

    id: "3",
    name: "Traje Clásico",
    image: "https://m.media-amazon.com/images/I/51oBfmmnrdL._AC_SX342_.jpg",
    sku: "SKU-003",
    category: "Trajes",
    description: "Traje clásico de corte recto, ideal para eventos formales.",
    can_rent: false,
    can_sell: true,
    is_serial: true,
    price_rent: 100,
    rent_unit: "día",
    price_sell: 450,
  }

];