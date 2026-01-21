import { Label } from "@/components/label";
import { ReservationCalendar } from "./ReservationCalendar";
import { CustomerSelector } from "./CustomerSelector";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { PriceSummary } from "./PriceSummary";
import { Input } from "@/components/input";
import { CalendarDays, MessageSquarePlus, ShoppingBag } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";

export function ReservationFormContent({
  item,
  size,
  color,
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
  operationType,
  setOperationType,
  notes,
  setNotes,
}: any) {

    useEffect(() => {
    if (item.can_rent && !item.can_sell && operationType !== "alquiler") {
      setOperationType("alquiler");
    } else if (item.can_sell && !item.can_rent && operationType !== "venta") {
      setOperationType("venta");
    }
  }, [item.can_rent, item.can_sell, operationType, setOperationType]);
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4">
      {/* SELECTOR DE MODO DE OPERACIÓN */}

      {item.can_rent && item.can_sell && (
        <Tabs
          value={operationType}
          onValueChange={(val: any) => setOperationType(val)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 h-11">
            <TabsTrigger
              value="alquiler"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex gap-2 items-center transition-all"
            >
              <CalendarDays className="w-4 h-4" /> Alquiler
            </TabsTrigger>
            <TabsTrigger
              value="venta"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white flex gap-2 items-center transition-all"
            >
              <ShoppingBag className="w-4 h-4" /> Venta
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* 1. INFO Y CANTIDAD */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
        <div className="w-12 h-12 bg-white rounded border flex items-center justify-center font-bold text-xs uppercase text-primary">
          {size || "S/T"}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold uppercase">{item.name}</h4>
          <p className="text-[10px] text-muted-foreground">
            Color: {color} | SKU: {item.sku}
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
          mode={operationType === "venta" ? "single" : "range"}
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
        <Textarea
          placeholder="Ej: Ajustar basta 2cm, El cliente trae sus propios accesorios..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* 4. RESUMEN FINANCIERO */}
      {dateRange?.from && dateRange?.to && (
        <PriceSummary
          item={item}
          operationType={operationType}
          startDate={dateRange.from}
          endDate={dateRange.to || dateRange.from}
          priceRent={item.price_rent}
          quantity={quantity}
          downPayment={downPayment}
          setDownPayment={setDownPayment}
          guarantee={guarantee}
          setGuarantee={setGuarantee}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          guaranteeType={guaranteeType}
          setGuaranteeType={setGuaranteeType}
        />
      )}
    </div>
  );
}
