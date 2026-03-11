// components/branches/BranchesModule.tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BranchesTable } from "./table/branches-table";
import { BranchDetails } from "./branch-details";
import { getBranchesAction } from "@/src/app/(tenant)/tenant/actions/branch.actions"; 
import type { Branch } from "@/src/types/branch/type.branch";
import type { BranchConfig } from "@/src/types/branch/type.branchConfig";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  ListViewIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

export function BranchesModule() {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchConfigs, setBranchConfigs] = useState<
    Record<string, BranchConfig>
  >({});
  const [branchMetrics, setBranchMetrics] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const branchesResult = await getBranchesAction();
      const branches = branchesResult.success ? branchesResult.data : [];
      setBranches(branches);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
  };

  const handleBackToList = () => {
    setSelectedBranch(null);
  };

  const handleUpdateBranch = (updatedBranch: Branch) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === updatedBranch.id ? updatedBranch : b)),
    );
  };

  const handleUpdateConfig = (config: BranchConfig) => {
    setBranchConfigs((prev) => ({
      ...prev,
      [config.branchId]: config,
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Cargando módulo de sucursales...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Tabs
        value={selectedBranch ? "details" : "list"}
        onValueChange={(value) => {
          if (value === "list") handleBackToList();
        }}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <HugeiconsIcon icon={ListViewIcon} />
            Lista de Sucursales
          </TabsTrigger>
          {selectedBranch && (
            <TabsTrigger value="details" className="flex items-center gap-2">
              <HugeiconsIcon icon={Building03Icon} />
              {selectedBranch.name}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <BranchesTable
            branches={branches}
            onSelectBranch={handleSelectBranch}
            onBranchesChange={setBranches}
          />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedBranch && (
            <BranchDetails
              branch={selectedBranch}
              config={branchConfigs[selectedBranch.id]}
              metrics={branchMetrics[selectedBranch.id]}
              onUpdate={handleUpdateBranch}
              onUpdateConfig={handleUpdateConfig}
              onBack={handleBackToList}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
