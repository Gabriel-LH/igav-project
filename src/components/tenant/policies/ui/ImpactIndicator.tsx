// components/tenant-policies/ImpactIndicator.tsx
'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PolicyImpact } from '@/src/application/interfaces/policies/PolicyImpact';

interface ImpactIndicatorProps {
  impact: PolicyImpact;
  message: string;
}

export function ImpactIndicator({ impact, message }: ImpactIndicatorProps) {
  const colors = {
    low: 'text-green-500 bg-green-50 dark:bg-green-950/20 border-green-200',
    medium: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200',
    high: 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200',
  };

  const icons = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  };

  const labels = {
    low: 'Bajo impacto',
    medium: 'Impacto operativo',
    high: 'Impacto crítico',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${colors[impact]}`}>
            <span>{icons[impact]}</span>
            <span>{labels[impact]}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}