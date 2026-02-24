import { Label } from "@/components/label";
import { ReservationCalendar } from "./ReservationCalendar";
import { CustomerSelector } from "./CustomerSelector";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { PriceSummary } from "./PriceSummary";
import { Input } from "@/components/input";
import {
  CalendarDays,
  InfoIcon,
  MessageSquarePlus,
  ShoppingBag,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { DateTimeContainer } from "../direct-transaction/DataTimeContainer";
import React from "react";
import { TimePicker } from "../direct-transaction/TimePicker";
import { addDays, format } from "date-fns";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
import { DateRangePickerContainer } from "./DateRangePickerContainer";
import { toast } from "sonner";
import { StockAssignmentWidget } from "../widget/StockAssignmentWidget";
import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarCheckIn01Icon } from "@hugeicons/core-free-icons";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/src/utils/currency-format";

export function ReservationFormContent({
  item,
  sizeId,
  colorId,
  pickupTime,
  setPickupTime,
  returnTime,
  setReturnTime,
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
  amountPaid,
  setAmountPaid,
  keepAsCredit,
  setKeepAsCredit,
  paymentMethod,
  setPaymentMethod,
  operationType,
  setOperationType,
  notes,
  setNotes,
  maxStock,
  setAssignedStockIds,
  useCredit,
  setUseCredit,
  balance,
}: any) {
  const businessRules = BUSINESS_RULES_MOCK;

  // 1. Creamos referencias para "disparar" los clics
  const pickupDateRef = React.useRef<HTMLButtonElement>(null);
  const pickupTimeRef = React.useRef<HTMLButtonElement>(null);
  // const returnDateRef = React.useRef<HTMLButtonElement>(null);
  const returnTimeRef = React.useRef<HTMLButtonElement>(null);

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
          <TabsList className="grid relative w-full grid-cols-2 bg-transparent border rounded-2xl p-1 h-11">
            <TabsTrigger
              value="alquiler"
              className="data-[state=active]:bg-blue-600/70  border-none backdrop-blur-lg rounded-r-2xl rounded-l-2xl data-[state=active]:text-white flex gap-2 items-center transition-all"
            >
              <CalendarDays className="w-4 h-4" /> Alquiler
            </TabsTrigger>
            <TabsTrigger
              value="venta"
              className="data-[state=active]:bg-orange-600/80  border-none backdrop-blur-lg rounded-r-2xl rounded-l-2xl data-[state=active]:text-white flex gap-2 items-center transition-all"
            >
              <ShoppingBag className="w-4 h-4" /> Venta
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* 1. INFO Y CANTIDAD */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
        <div className="w-12 h-12 rounded border flex items-center justify-center font-bold text-xs uppercase text-primary">
          {sizeId || "S/T"}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold uppercase">{item.name}</h4>
          <p className="text-[10px] text-muted-foreground">
            Color: {colorId} | SKU: {item.sku}
          </p>
        </div>
        <div className="w-20">
          <Label className="text-[9px] uppercase font-black">Cant.</Label>
          <Input
            type="number"
            min={1}
            max={maxStock}
            value={quantity}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val > maxStock) {
                // Bloqueo manual por si el navegador falla
                setQuantity(maxStock);
                toast.error(`Máximo disponible: ${maxStock}`);
              } else {
                setQuantity(val);
              }
            }}
            className={`h-8 font-bold ${quantity > maxStock ? "border-red-500 text-red-500" : ""}`}
          />
          {/* Feedback visual chiquito */}
          <span className="text-[8px] text-muted-foreground">
            Max: {maxStock}
          </span>
        </div>
      </div>

      {/* 2. CALENDARIO Y TIEMPO */}
      <div className="relative">
        {operationType === "alquiler" ? (
          <div className="relative">
            <DateRangePickerContainer
              label="Periodo de Alquiler y Horas"
              fromDate={dateRange?.from}
              toDate={dateRange?.to}
              fromTime={pickupTime}
              toTime={returnTime}
              onDateClick={() => pickupDateRef.current?.click()}
              onFromTimeClick={() => pickupTimeRef.current?.click()}
              onToTimeClick={() => returnTimeRef.current?.click()}
            />
            {/* MOTORES ESPECÍFICOS PARA ALQUILER */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Calendario cubre todo el área para la fecha */}
              <ReservationCalendar
                triggerRef={pickupDateRef}
                mode="range"
                originBranchId={originBranchId}
                currentBranchId={currentBranchId}
                dateRange={dateRange}
                setDateRange={setDateRange}
                rules={businessRules}
                productId={item.id}
                sizeId={sizeId}
                colorId={colorId}
                quantity={quantity}
                type={operationType}
              />
              {/* Estos botones invisibles se posicionan en los extremos para las horas */}
              <div className="absolute left-0 bottom-0 w-1/2 h-1/2">
                <TimePicker
                  triggerRef={pickupTimeRef}
                  value={pickupTime}
                  onChange={setPickupTime}
                />
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-1/2">
                <TimePicker
                  triggerRef={returnTimeRef}
                  value={returnTime}
                  onChange={setReturnTime}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <DateTimeContainer
              label="Fecha de Entrega"
              date={dateRange?.from}
              time={pickupTime}
              onDateClick={() => pickupDateRef.current?.click()}
              onTimeClick={() => pickupTimeRef.current?.click()}
              placeholderDate="Seleccionar fecha"
              placeholderTime="Seleccionar hora"
            />
            {/* MOTORES PARA VENTA */}
            <div className="absolute inset-0 pointer-events-none">
              <ReservationCalendar
                triggerRef={pickupDateRef}
                mode="single"
                originBranchId={originBranchId}
                currentBranchId={currentBranchId}
                dateRange={dateRange}
                setDateRange={setDateRange}
                rules={businessRules}
                productId={item.id}
                sizeId={sizeId}
                colorId={colorId}
                type={operationType}
              />
              <div className="absolute right-0 bottom-0 w-1/2 h-1/2">
                <TimePicker
                  triggerRef={pickupTimeRef}
                  value={pickupTime}
                  onChange={setPickupTime}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {originBranchId !== currentBranchId && (
        <div className="p-2 rounded-md flex gap-2 items-center border">
          <InfoIcon className="w-3 h-3 text-blue-500" />
          <p className="text-[10px] text-blue-400">
            Disponible para traslado desde el:{" "}
            <strong>
              {format(
                addDays(
                  new Date(),
                  getEstimatedTransferTime(
                    originBranchId,
                    currentBranchId,
                    businessRules,
                  ) + 1,
                ),
                "dd/MM/yy",
              )}
            </strong>
          </p>
        </div>
      )}

      {/* 3. CLIENTE */}
      <CustomerSelector
        selected={selectedCustomer}
        onSelect={setSelectedCustomer}
      />

      <div className="space-y-2">
        <Label className="text-[10px] uppercase font-bold flex items-center">
          <MessageSquarePlus className="w-3 h-3" /> Notas y Ajustes
        </Label>
        <Textarea
          placeholder="Ej: Ajustar basta 2cm, El cliente trae sus propios accesorios..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {balance > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-700 uppercase">
              Saldo a favor disponible
            </span>
            <span className="text-sm font-bold text-blue-900">
              {formatCurrency(balance)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="use-credit" className="text-xs font-bold">
              Usar crédito
            </Label>
            <Switch
              id="use-credit"
              checked={useCredit}
              onCheckedChange={setUseCredit}
            />
          </div>
        </div>
      )}

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
          amountPaid={amountPaid}
          setAmountPaid={setAmountPaid}
          keepAsCredit={keepAsCredit}
          setKeepAsCredit={setKeepAsCredit}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
        />
      )}

      {/* CONDICIONAL CLAVE */}
      {operationType === "venta" ? (
        // CASO VENTA: ASIGNACIÓN INMEDIATA OBLIGATORIA (HARD ALLOCATION)
        // El cliente está apartando ESTE producto físico para que nadie más lo compre.
        <div className="p-3 border rounded-lg">
          <p className="text-[10px] font-bold text-orange-800 uppercase mb-2">
            Selecciona la prenda a apartar (Venta):
          </p>
          <StockAssignmentWidget
            isImmediate={true} // Debe estar disponible HOY
            operationType="venta"
            productId={item.id}
            sizeId={sizeId}
            colorId={colorId}
            quantity={quantity}
            dateRange={dateRange} // Asegúrate de pasar el objeto {from, to}
            currentBranchId={currentBranchId}
            onAssignmentChange={setAssignedStockIds} // <---
            isSerial={item.is_serial}
          />
        </div>
      ) : (
        // CASO ALQUILER: SOLO INFORMACIÓN (SOFT ALLOCATION)
        // No seleccionamos stock físico. Solo mostramos disponibilidad.
        <div className="p-3 border rounded-lg flex items-center gap-3">
          <HugeiconsIcon
            icon={CalendarCheckIn01Icon}
            className="text-blue-600 w-5 h-5"
          />
          <div>
            <p className="text-xs font-bold">Reserva por Cupo</p>
            <p className="text-[10px] text-muted-foreground">
              Se reservará {quantity} unidad del stock general. La prenda física
              se asignará el día de la entrega.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
