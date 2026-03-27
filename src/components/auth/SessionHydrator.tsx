"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/src/store/useSessionStore";

interface SessionData {
  user: { id: string; email: string; name: string };
  membership: {
    tenantId: string;
    role: { id: string; name: string } | null;
    branch: { id: string; name: string } | null;
  };
}

export function SessionHydrator({ data }: { data: SessionData }) {
  const setSession = useSessionStore((state) => state.setSession);

  useEffect(() => {
    if (data) {
      setSession(data.user, data.membership);
    }
  }, [data, setSession]);

  return null;
}
