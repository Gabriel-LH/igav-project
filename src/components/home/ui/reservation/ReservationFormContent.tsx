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

export function ReservationFormContent({
  item,
  size,
  color,
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
  const businessRules = BUSINESS_RULES_MOCK;

  // 1. Creamos referencias para "disparar" los clics
  const pickupDateRef = React.useRef<HTMLButtonElement>(null);
  const pickupTimeRef = React.useRef<HTMLButtonElement>(null);
  const returnDateRef = React.useRef<HTMLButtonElement>(null);
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
        <div className="w-12 h-12 rounded border flex items-center justify-center font-bold text-xs uppercase text-primary">
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
                size={size}
                color={color}
                quantityDesired={quantity}
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
                size={size}
                color={color}
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
