"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandLayout } from "../../catalogs/brand/brand-layout";
import { Brand } from "@/src/types/brand/type.brand";
import { ModelLayout } from "../../catalogs/model/model-layout";
import { Model } from "@/src/types/model/type.model";
import { CategoryLayout } from "../../catalogs/category/category-layout";
import { Category } from "@/src/types/category/type.category";
import { AttributesLayout } from "../../catalogs/attributes-type/attributes-layout";
import { AttributeType, AttributeValue } from "@prisma/client";
import { AttributeValueLayout } from "../../catalogs/attribute-value/attribute-layout";
import { useScrollableTabs } from "@/src/utils/scroll/handleTabChange";
import { useState } from "react";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface CatalogTabContentProps {
  initialBrands: Brand[];
  initialModels: Model[];
  initialCategories: Category[];
  initialAttributeTypes: AttributeType[];
  initialAttributeValues: AttributeValue[];
}

export function CatalogTabContent({
  initialBrands,
  initialModels,
  initialCategories,
  initialAttributeTypes,
  initialAttributeValues,
}: CatalogTabContentProps) {
  const [activeTab, setActiveTab] = useState("brands");
  const isMobile = useIsMobile();
  const { tabRefs, scrollToTab } = useScrollableTabs();

  const handleTabChange = (value: string) => {
    if (isMobile) {
      scrollToTab(value as keyof typeof tabRefs);
      setActiveTab(value);
    } else {
      setActiveTab(value);
    }
  };

  return (
    <div>
      <Tabs
        defaultValue="brands"
        className="w-full"
        value={activeTab}
        onValueChange={handleTabChange}
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
              ref={tabRefs.brands}
              value="brands"
              className={cn(
                isMobile
                  ? "flex items-center bg-card gap-2 whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2 whitespace-nowrap",
              )}
            >
              Marcas
            </TabsTrigger>
            <TabsTrigger
              ref={tabRefs.models}
              value="models"
              className={cn(
                isMobile
                  ? "flex items-center bg-card gap-2 whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2 whitespace-nowrap",
              )}
            >
              Modelos
            </TabsTrigger>
            <TabsTrigger
              ref={tabRefs.categories}
              value="categories"
              className={cn(
                isMobile
                  ? "flex items-center bg-card gap-2 whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2 whitespace-nowrap",
              )}
            >
              Categorias
            </TabsTrigger>
            <TabsTrigger
              ref={tabRefs.attributes}
              value="attributes"
              className={cn(
                isMobile
                  ? "flex items-center bg-card gap-2 whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2 whitespace-nowrap",
              )}
            >
              Tipos de Atributos
            </TabsTrigger>
            <TabsTrigger
              ref={tabRefs.attributeValues}
              value="attribute-values"
              className={cn(
                isMobile
                  ? "flex items-center bg-card gap-2 whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2 whitespace-nowrap",
              )}
            >
              Valores de Atributos
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="brands">
          <BrandLayout initialBrands={initialBrands} />
        </TabsContent>
        <TabsContent value="models">
          <ModelLayout
            initialModels={initialModels}
            initialBrands={initialBrands}
          />
        </TabsContent>
        <TabsContent value="categories">
          <CategoryLayout initialCategories={initialCategories} />
        </TabsContent>
        <TabsContent value="attributes">
          <AttributesLayout initialAttributeTypes={initialAttributeTypes} />
        </TabsContent>
        <TabsContent value="attribute-values">
          <AttributeValueLayout
            initialAttributeValues={initialAttributeValues}
            attributeTypes={initialAttributeTypes}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
