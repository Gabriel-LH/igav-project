"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History, User, Tag, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/src/utils/currency-format";

interface PriceHistoryEntry {
  id: string;
  variantId: string;
  variantCode: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  createdAt: string | Date;
  userName: string;
}

interface PriceHistoryTableProps {
  history: PriceHistoryEntry[];
}

export function PriceHistoryTable({ history }: PriceHistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
        <History className="w-12 h-12 mb-4 opacity-20" />
        <p>No hay cambios de precios registrados aún.</p>
      </div>
    );
  }

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case "adjustment":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Ajuste Manual</Badge>;
      case "purchase":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Compra</Badge>;
      case "import":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Importación</Badge>;
      default:
        return <Badge variant="secondary">{reason}</Badge>;
    }
  };

  return (
    <div className="rounded-md border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[180px]">Fecha</TableHead>
            <TableHead>Variante</TableHead>
            <TableHead>Cambio</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead className="text-right">Motivo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((entry) => (
            <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium whitespace-nowrap">
                {format(new Date(entry.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-xs">{entry.variantCode}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through text-xs">
                    {formatCurrency(entry.oldPrice)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="font-semibold text-primary">
                    {formatCurrency(entry.newPrice)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm">{entry.userName}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {getReasonBadge(entry.reason)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
