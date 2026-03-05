"use client";

import { ReactNode } from "react";
import { usePlanFeatures } from "@/src/hooks/usePlanFeatures";
import { PlanFeatureKey } from "@/src/types/plan/planFeature";

interface FeatureGuardProps {
  /** Un único feature o un array de features a verificar */
  feature: PlanFeatureKey | PlanFeatureKey[];
  /** Contenido a mostrar si el usuario tiene acceso */
  children: ReactNode;
  /** Contenido a mostrar si el usuario NO tiene acceso (opcional) */
  fallback?: ReactNode;
  /** Si es true y se provee un array, el usuario debe tener TODOS los features. Si es false, basta con que tenga UNO (por defecto: false) */
  requireAll?: boolean;
}

/**
 * Componente Wrapper para proteger partes de la UI basado en las características del plan elegido.
 */
export const FeatureGuard = ({
  feature,
  children,
  fallback = null,
  requireAll = false,
}: FeatureGuardProps) => {
  const { hasFeature } = usePlanFeatures();

  const features = Array.isArray(feature) ? feature : [feature];

  const isAllowed = requireAll
    ? features.every((f) => hasFeature(f))
    : features.some((f) => hasFeature(f));

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
