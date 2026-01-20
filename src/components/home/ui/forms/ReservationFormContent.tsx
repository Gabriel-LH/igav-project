import { Label } from "@/components/label";
import { ReservationCalendar } from "./ReservationCalendar";
import { CustomerSelector } from "../reservation/CustomerSelector";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { PriceSummary } from "../reservation/PriceSummary";
import { Input } from "@/components/input";
import { MessageSquarePlus } from "lucide-react";

// src/components/home/reservation-form-content.tsx
// src/components/home/reservation-form-content.tsx

export function ReservationFormContent({
  item,
  originBranchId,
  currentBranchId,
  dateRange,
  setDateRange,
  selectedCustomer,
  setSelectedCustomer,
  quantity,
  setQuantity,
  downPayment,
  setDownPayment,
  guarantee,
  setGuarantee,
  paymentMethod,
  setPaymentMethod,
  guaranteeType,
  setGuaranteeType,
  notes,
  setNotes,
}: any) {
  // Nota: luego puedes cambiar 'any' por una Interface propia
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
      {/* 1. INFO Y CANTIDAD */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
        <div className="w-12 h-12 bg-white rounded border flex items-center justify-center font-bold text-xs uppercase text-primary">
          {item.size || "S/T"}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold uppercase">{item.name}</h4>
          <p className="text-[10px] text-muted-foreground">
            Color: {item.color} | SKU: {item.sku}
          </p>
        </div>
        <div className="w-20">
          <Label className="text-[9px] uppercase font-black">Cant.</Label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="h-8 font-bold"
          />
        </div>
      </div>

      {/* 2. CALENDARIO */}
      <div className="space-y-3">
        <Label className="text-[10px] uppercase font-black text-muted-foreground">
          Fechas del Evento
        </Label>
        <ReservationCalendar
          originBranchId={originBranchId}
          currentBranchId={currentBranchId}
          dateRange={dateRange}
          setDateRange={setDateRange}
          rules={BUSINESS_RULES_MOCK}
        />
      </div>

      {/* 3. CLIENTE */}
      <CustomerSelector
        selected={selectedCustomer}
        onSelect={setSelectedCustomer}
      />

      <div className="space-y-2">
        <Label className="text-[10px] uppercase font-black text-muted-foreground flex items-center gap-2">
          <MessageSquarePlus className="w-3 h-3" /> Notas y Ajustes
        </Label>
        <textarea
          placeholder="Ej: Ajustar basta 2cm, El cliente trae sus propios accesorios..."
          className="text-xs px-2 py-1 w-full h-12 rounded border resize-none bg-muted/20 focus-visible:ring-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* 4. RESUMEN FINANCIERO */}
      {dateRange?.from && dateRange?.to && (
        <PriceSummary
          startDate={dateRange.from}
          endDate={dateRange.to}
          priceRent={item.price_rent}
          quantity={quantity}
          downPayment={downPayment}
          setDownPayment={setDownPayment}
          guarantee={guarantee}
          setGuarantee={setGuarantee}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
        />
      )}
    </div>
  );
}
