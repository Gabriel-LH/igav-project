// components/subscription/subscription-layout.tsx
"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrentPlanTab } from "./tabs/current-plan-tab";
import { AvailablePlansTab } from "./tabs/available-plan-tab";
import { UsageLimitsTab } from "./tabs/usage-limits-tab";
import { ChangePlanModal } from "./modal/ChangePlanModal";
import { CancelSubscriptionModal } from "./modal/CancelSubscriptionModal";
import { PLANS_MOCK } from "@/src/mocks/mock.plans";
import { PLAN_FEATURES_MOCK } from "@/src/mocks/mock.planFeature";
import { PLAN_LIMITS_MOCK } from "@/src/mocks/mock.planLimit";
import { TENTANT_SUBSCRIPTIONS_MOCK } from "@/src/mocks/mock.tenantSuscription";
import { PLAN_MODULES_MOCK } from "@/src/mocks/mock.planModules";
import {
  mapPlansWithFeatures,
  getCurrentUsage,
} from "@/src/adapters/subscription-adapter";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSpeed02Icon,
  Diamond02Icon,
  More01Icon,
} from "@hugeicons/core-free-icons";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useScrollableTabs } from "@/src/utils/scroll/handleTabChange";

export function SubscriptionLayout() {
  const [activeTab, setActiveTab] = useState("current");
  const [subscription] = useState(TENTANT_SUBSCRIPTIONS_MOCK[0]);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const isMobile = useIsMobile();

  // Obtener el plan actual
  const currentPlan = useMemo(
    () => PLANS_MOCK.find((p) => p.id === subscription.planId),
    [subscription.planId],
  );

  // Obtener todos los planes con sus features y límites
  const plansWithFeatures = useMemo(
    () =>
      mapPlansWithFeatures(
        PLANS_MOCK,
        PLAN_FEATURES_MOCK,
        PLAN_LIMITS_MOCK,
        PLAN_MODULES_MOCK,
      ),
    [],
  );

  const { tabRefs, scrollToTab } = useScrollableTabs();

  const handleTabChange = (value: string) => {
    if (isMobile) {
      scrollToTab(value as keyof typeof tabRefs);
      setActiveTab(value);
    } else {
      setActiveTab(value);
    }
  };

  // Uso actual del tenant
  const currentUsage = useMemo(() => getCurrentUsage(), []);
  const currentPlanWithFeatures = useMemo(() => {
    if (!currentPlan) return plansWithFeatures[0];
    return (
      plansWithFeatures.find((p) => p.id === currentPlan.id) ??
      plansWithFeatures[0]
    );
  }, [currentPlan, plansWithFeatures]);

  const handleChangePlan = (planId: string) => {
    setSelectedPlanId(planId);
    setShowChangePlan(true);
  };

  const handleConfirmChangePlan = (
    planId: string,
    cycle: "monthly" | "yearly",
  ) => {
    // Aquí iría la lógica para cambiar el plan
    console.log(`Cambiando a plan ${planId} con ciclo ${cycle}`);
    setShowChangePlan(false);
    // Actualizar suscripción
  };

  const handleCancelSubscription = (reason: string) => {
    // Aquí iría la lógica para cancelar
    console.log(`Cancelando suscripción: ${reason}`);
    setShowCancelModal(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Tabs principales */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <div className={cn("w-full", isMobile && "overflow-x-auto")}>
          <TabsList
            className={cn(
              isMobile
                ? "w-max min-w-full gap-2 sm:grid sm:w-full sm:grid-cols-3 bg-transparent"
                : "flex",
            )}
          >
            <TabsTrigger
              ref={tabRefs.current}
              value="current"
              className={cn(
                isMobile
                  ? "flex items-center gap-2 bg-card whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2",
              )}
            >
              <HugeiconsIcon icon={Diamond02Icon} strokeWidth={2.2} />
              Plan actual
            </TabsTrigger>

            <TabsTrigger
              ref={tabRefs.plans}
              value="plans"
              className={cn(
                isMobile
                  ? "flex items-center bg-card gap-2 whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2 whitespace-nowrap",
              )}
            >
              <HugeiconsIcon icon={More01Icon} strokeWidth={2.2} />
              Planes disponibles
            </TabsTrigger>

            <TabsTrigger
              ref={tabRefs.usage}
              value="usage"
              className={cn(
                isMobile
                  ? "flex items-center bg-card gap-2 whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2 whitespace-nowrap",
              )}
            >
              <HugeiconsIcon icon={DashboardSpeed02Icon} strokeWidth={2.2} />
              Uso y límites
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="current" className="space-y-4">
          <CurrentPlanTab
            subscription={subscription}
            currentPlan={currentPlanWithFeatures}
            currentPlanWithFeatures={currentPlanWithFeatures}
            currentUsage={currentUsage}
            onOpenChangePlan={() => {
              setSelectedPlanId(null);
              setShowChangePlan(true);
            }}
            onOpenCancelModal={() => setShowCancelModal(true)}
          />
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <AvailablePlansTab
            plans={plansWithFeatures}
            currentPlanId={currentPlan?.id || ""}
            onSelectPlan={handleChangePlan}
          />
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <UsageLimitsTab
            usage={currentUsage}
            limits={currentPlanWithFeatures?.limits}
            currentPlanName={currentPlan?.name || ""}
            onUpgrade={() => {
              setActiveTab("plans");
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Modales */}
      <ChangePlanModal
        open={showChangePlan}
        onOpenChange={setShowChangePlan}
        plans={plansWithFeatures}
        selectedPlanId={selectedPlanId}
        currentPlanId={currentPlan?.id}
        onConfirm={handleConfirmChangePlan}
      />

      <CancelSubscriptionModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        onConfirm={handleCancelSubscription}
        planName={currentPlan?.name || ""}
      />
    </div>
  );
}
