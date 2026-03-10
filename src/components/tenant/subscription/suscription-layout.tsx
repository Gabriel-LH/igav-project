// components/subscription/subscription-layout.tsx
"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrentPlanTab } from "./tabs/current-plan-tab";
import { AvailablePlansTab } from "./tabs/available-plan-tab";
import { UsageLimitsTab } from "./tabs/usage-limits-tab";
import { ChangePlanModal } from "./modal/ChangePlanModal";
import { CancelSubscriptionModal } from "./modal/CancelSubscriptionModal";
import type { PlanWithFeatures } from "@/src/adapters/subscription-adapter";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSpeed02Icon,
  Diamond02Icon,
  More01Icon,
} from "@hugeicons/core-free-icons";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useScrollableTabs } from "@/src/utils/scroll/handleTabChange";
import { TenantSubscription } from "@/src/types/tenant/tenantSuscription";
import {
  TenantSubscriptionUsage,
  changeTenantPlanAction,
} from "@/src/app/(tenant)/tenant/actions/subscription.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SubscriptionLayoutProps {
  subscription: TenantSubscription | null;
  plans: PlanWithFeatures[];
  currentUsage: TenantSubscriptionUsage | null;
  hasPaymentMethod?: boolean;
}

export function SubscriptionLayout({
  subscription,
  plans,
  currentUsage,
  hasPaymentMethod = false,
}: SubscriptionLayoutProps) {
  const [activeTab, setActiveTab] = useState("current");
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const router = useRouter();

  const isMobile = useIsMobile();

  // Obtener el plan actual
  const currentPlan = useMemo(() => {
    if (!subscription) return null;
    return plans.find((p) => p.id === subscription.planId) ?? null;
  }, [subscription, plans]);

  const { tabRefs, scrollToTab } = useScrollableTabs();

  const handleTabChange = (value: string) => {
    if (isMobile) {
      scrollToTab(value as keyof typeof tabRefs);
      setActiveTab(value);
    } else {
      setActiveTab(value);
    }
  };

  const currentPlanWithFeatures = useMemo(() => {
    if (!currentPlan) return plans[0];
    return plans.find((p) => p.id === currentPlan.id) ?? plans[0];
  }, [currentPlan, plans]);

  const canChangePlan =
    subscription?.status !== "trial" || hasPaymentMethod;

  const handleChangePlan = (planId: string) => {
    if (!canChangePlan) {
      toast.message("Agrega un método de pago para cambiar de plan.");
      return;
    }
    setSelectedPlanId(planId);
    setShowChangePlan(true);
  };

  const handleConfirmChangePlan = async (
    planId: string,
    cycle: "monthly" | "yearly",
  ) => {
    if (isChangingPlan) return;
    setIsChangingPlan(true);
    try {
      const result = await changeTenantPlanAction(planId, cycle);
      if (result?.unchanged) {
        toast.message("El plan ya está activo con el mismo ciclo.");
      } else {
        toast.success("Plan actualizado correctamente");
      }
      setShowChangePlan(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cambiar el plan";
      console.error(error);
      if (message.toLowerCase().includes("payment method")) {
        toast.error("Agrega un método de pago para cambiar de plan.");
      } else {
        toast.error("No se pudo cambiar el plan");
      }
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleCancelSubscription = (reason: string) => {
    // Aquí iría la lógica para cancelar
    console.log(`Cancelando suscripción: ${reason}`);
    setShowCancelModal(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {!subscription && (
        <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
          No hay una suscripción activa o en prueba para este tenant.
        </div>
      )}
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
          {subscription && currentPlanWithFeatures && currentUsage && (
            <CurrentPlanTab
              subscription={subscription}
              currentPlan={currentPlanWithFeatures}
              currentPlanWithFeatures={currentPlanWithFeatures}
              currentUsage={currentUsage}
              onOpenChangePlan={() => {
                if (!canChangePlan) {
                  toast.message("Agrega un método de pago para cambiar de plan.");
                  return;
                }
                setSelectedPlanId(null);
                setShowChangePlan(true);
              }}
              onOpenCancelModal={() => setShowCancelModal(true)}
              disableChangePlan={!canChangePlan}
            />
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <AvailablePlansTab
            plans={plans}
            currentPlanId={currentPlan?.id || ""}
            onSelectPlan={handleChangePlan}
            disableChangePlan={!canChangePlan}
          />
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {currentUsage && currentPlanWithFeatures && (
            <UsageLimitsTab
              usage={currentUsage}
              limits={currentPlanWithFeatures?.limits}
              currentPlanName={currentPlan?.name || ""}
              onUpgrade={() => {
                setActiveTab("plans");
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Modales */}
      <ChangePlanModal
        open={showChangePlan}
        onOpenChange={setShowChangePlan}
        plans={plans}
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
