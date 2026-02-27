"use client";

// components/analytics/tables/garments-performance-table.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { FeatureGuard } from "@/src/components/guards/FeatureGuard";

import { useAnalyticsData } from "@/src/hooks/useAnalyticsData";

export function GarmentsPerformanceTable() {
  const { performanceData: mockData } = useAnalyticsData();

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prenda</TableHead>
            <FeatureGuard feature="rentals">
              <TableHead>Alquileres</TableHead>
            </FeatureGuard>
            <FeatureGuard feature="sales">
              <TableHead>Ventas</TableHead>
            </FeatureGuard>
            <FeatureGuard feature="rentals">
              <TableHead>Días en uso</TableHead>
            </FeatureGuard>
            <TableHead>Ingresos</TableHead>
            <TableHead>ROI</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {mockData.map((item) => (
            <TableRow key={item.name}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <FeatureGuard feature="rentals">
                <TableCell>{item.rentals}</TableCell>
              </FeatureGuard>
              <FeatureGuard feature="sales">
                <TableCell>{item.sales}</TableCell>
              </FeatureGuard>
              <FeatureGuard feature="rentals">
                <TableCell>{item.usageDays}</TableCell>
              </FeatureGuard>
              <TableCell>${item.revenue.toLocaleString()}</TableCell>
              <TableCell>{item.roi}%</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium",
                    item.status === "scale" && "bg-green-100 text-green-700",
                    item.status === "maintain" &&
                      "bg-yellow-100 text-yellow-700",
                    item.status === "review" && "bg-red-100 text-red-700",
                  )}
                >
                  {item.status === "scale"
                    ? "Escalar"
                    : item.status === "maintain"
                      ? "Mantener"
                      : "Revisar"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
