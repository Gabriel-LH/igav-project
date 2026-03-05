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

export function SubscriptionLayout() {
  const [activeTab, setActiveTab] = useState("current");
  const [subscription] = useState(TENTANT_SUBSCRIPTIONS_MOCK[0]);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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

  // Uso actual del tenant
  const currentUsage = useMemo(() => getCurrentUsage(), []);
  const currentPlanWithFeatures = useMemo(() => {
    if (!currentPlan) return plansWithFeatures[0];
    return plansWithFeatures.find((p) => p.id === currentPlan.id) ?? plansWithFeatures[0];
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
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <span>📋</span>
            Plan actual
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <span>🔄</span>
            Planes disponibles
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <span>📊</span>
            Uso y límites
          </TabsTrigger>
        </TabsList>

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
