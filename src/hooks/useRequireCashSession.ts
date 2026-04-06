"use client";

import { useCashSessionStore } from "@/src/store/useCashSessionStore";
import { useSessionStore } from "@/src/store/useSessionStore";
import { useTenantConfigStore } from "@/src/store/useTenantConfigStore";

/**
 * Hook to validate if a cash session is required and if one is currently active.
 */
export function useRequireCashSession() {
  const { config } = useTenantConfigStore();
  const { sessions } = useCashSessionStore();
  const { user, membership } = useSessionStore();

  const isRequired = config?.cash?.openingCashRequired ?? false;
  const currentBranchId = membership?.branch?.id;
  const currentUserId = user?.id;

  // We consider a session active if there is an OPEN session in the current branch.
  // Depending on business rules, it might also need to be owned by the current user.
  // For now, following the logic in openCashSessionAction which checks per branch.
  const activeSession = sessions.find(
    (s) => s.status === "open" && s.branchId === currentBranchId
  );

  const hasActiveSession = !!activeSession;
  const canProceed = !isRequired || hasActiveSession;

  return {
    isRequired,
    hasActiveSession,
    canProceed,
    activeSession,
  };
}
