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

const mockData = [
  {
    name: "Vestido Negro Largo",
    rentals: 14,
    sales: 3,
    usageDays: 62,
    revenue: 4200,
    roi: 185,
    status: "scale",
  },
  {
    name: "Traje Azul",
    rentals: 4,
    sales: 1,
    usageDays: 18,
    revenue: 900,
    roi: 65,
    status: "review",
  },
];

export function GarmentsPerformanceTable() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prenda</TableHead>
            <TableHead>Alquileres</TableHead>
            <TableHead>Ventas</TableHead>
            <TableHead>Días en uso</TableHead>
            <TableHead>Ingresos</TableHead>
            <TableHead>ROI</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {mockData.map((item) => (
            <TableRow key={item.name}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.rentals}</TableCell>
              <TableCell>{item.sales}</TableCell>
              <TableCell>{item.usageDays}</TableCell>
              <TableCell>${item.revenue.toLocaleString()}</TableCell>
              <TableCell>{item.roi}%</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium",
                    item.status === "scale" && "bg-green-100 text-green-700",
                    item.status === "maintain" &&
                      "bg-yellow-100 text-yellow-700",
                    item.status === "review" && "bg-red-100 text-red-700"
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
