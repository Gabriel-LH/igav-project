"use client";

import { useEffect } from "react";
import { useUserStore } from "@/src/store/useUserStore";

export function UserHydrator({ data }: { data: any[] }) {
  const setUsers = useUserStore((state) => state.setUsers);

  useEffect(() => {
    if (data) {
      setUsers(data);
    }
  }, [data, setUsers]);

  return null;
}
