"use client";

import { useEffect } from "react";
import { useRentalStore } from "@/src/store/useRentalStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
import { Rental } from "@/src/types/rentals/type.rentals";
import { RentalItem } from "@/src/types/rentals/type.rentalsItem";
import { Product } from "@/src/types/product/type.product";
import { Client } from "@/src/types/clients/type.client";
import { Guarantee } from "@/src/types/guarantee/type.guarantee";

interface ReturnDataLoaderProps {
  data: {
    rentals: Rental[];
    rentalItems: RentalItem[];
    products: Product[];
    productVariants: any[];
    customers: Client[];
    guarantees: Guarantee[];
  };
}

export function ReturnDataLoader({ data }: ReturnDataLoaderProps) {
  const setRentalData = useRentalStore((s) => s.setRentalData);
  const setProducts = useInventoryStore((s) => s.setProducts);
  const setProductVariants = useInventoryStore((s) => s.setProductVariants);
  const setCustomers = useCustomerStore((s) => s.setCustomers);
  const setGuarantees = useGuaranteeStore((s) => s.setGuarantees);

  useEffect(() => {
    setRentalData(data.rentals, data.rentalItems);
    setProducts(data.products);
    setProductVariants(data.productVariants);
    setCustomers(data.customers);
    setGuarantees(data.guarantees);
  }, [data, setRentalData, setProducts, setProductVariants, setCustomers, setGuarantees]);

  return null;
}
