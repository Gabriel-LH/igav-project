// src/components/billing/features/FeaturesManager.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Save } from "lucide-react";
import {
  PLAN_FEATURE_KEYS,
  PlanFeatureKey,
} from "@/src/types/plan/planFeature";

interface FeaturesManagerProps {
  selectedFeatures: Set<PlanFeatureKey>;
  onFeatureToggle: (feature: PlanFeatureKey) => void;
  mode: "global" | "plan";
  planName?: string;
  title?: string;
  description?: string;
  showSearch?: boolean;
  onSave?: () => void;
}

export const FeaturesManager: React.FC<FeaturesManagerProps> = ({
  selectedFeatures,
  onFeatureToggle,
  mode,
  planName,
  title,
  description,
  showSearch = true,
  onSave,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const getFeatureLabel = (feature: string) => {
    return feature
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const getFeatureCategory = (feature: string) => {
    if (feature.includes("sales") || feature.includes("rentals"))
      return "Ventas";
    if (feature.includes("inventory") || feature.includes("products"))
      return "Inventario";
    if (feature.includes("user") || feature.includes("permissions"))
      return "Usuarios";
    if (feature.includes("analytics") || feature.includes("promotions"))
      return "Marketing";
    if (feature.includes("referral") || feature.includes("loyalty"))
      return "Fidelización";
    return "General";
  };

  const filteredFeatures = PLAN_FEATURE_KEYS.filter((feature) =>
    feature.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const featuresByCategory = filteredFeatures.reduce(
    (acc, feature) => {
      const category = getFeatureCategory(feature);
      if (!acc[category]) acc[category] = [];
      acc[category].push(feature);
      return acc;
    },
    {} as Record<string, PlanFeatureKey[]>,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title ||
            (mode === "global"
              ? "Features del Sistema"
              : `Features: ${planName}`)}
        </CardTitle>
        <CardDescription>
          {description ||
            (mode === "global"
              ? "Configura las características disponibles en todo el sistema"
              : `Selecciona las características incluidas en el plan ${planName}`)}
        </CardDescription>
        {showSearch && (
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar características..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(featuresByCategory).map(([category, features]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {category}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {features.map((feature) => {
                  const isSelected = selectedFeatures.has(feature);
                  const label = getFeatureLabel(feature);

                  return (
                    <div
                      key={feature}
                      className={`
                        flex items-center space-x-2 p-3 rounded-lg border
                        ${isSelected ? "bg-primary/5 border-primary/20" : "bg-muted/50"}
                        cursor-pointer hover:bg-primary/10 transition-colors
                      `}
                      onClick={() => onFeatureToggle(feature)}
                    >
                      <Checkbox
                        id={`feature-${feature}`}
                        checked={isSelected}
                        onCheckedChange={() => onFeatureToggle(feature)}
                      />
                      <Label
                        htmlFor={`feature-${feature}`}
                        className="text-sm font-medium leading-none capitalize cursor-pointer flex-1"
                      >
                        {label}
                      </Label>
                      {isSelected && (
                        <Badge variant="secondary" className="ml-auto">
                          Incluido
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedFeatures.size} de {PLAN_FEATURE_KEYS.length}{" "}
            características seleccionadas
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedFeatures.size === PLAN_FEATURE_KEYS.length) {
                  PLAN_FEATURE_KEYS.forEach((f) => {
                    if (selectedFeatures.has(f)) onFeatureToggle(f);
                  });
                } else {
                  PLAN_FEATURE_KEYS.forEach((f) => {
                    if (!selectedFeatures.has(f)) onFeatureToggle(f);
                  });
                }
              }}
            >
              {selectedFeatures.size === PLAN_FEATURE_KEYS.length
                ? "Deseleccionar todas"
                : "Seleccionar todas"}
            </Button>
            {onSave && (
              <Button size="sm" onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
