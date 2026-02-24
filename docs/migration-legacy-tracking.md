# Seguimiento de errores de migración/legado

Última actualización: 24/02/2026
Comando utilizado: `npx tsc --noEmit --pretty false`

## 1) Grupos de alto impacto actuales

1. Migración `size/color` -> `sizeId/colorId` no completada

- Síntomas: `TS2339`, `TS2551`, `TS2322`, `TS2353`
- Zonas principales:
- `src/components/home/details-reserved-viewer.tsx`
- `src/components/home/reservation-product-card.tsx`
- `src/components/rentals/ui/modals/DeliverRentalModal.tsx`
- `src/components/return/*`
- `src/hooks/useStockAllocation.ts`
- `src/mocks/mock.reservationItem.ts`

2. `stockLots.status` hace referencia, pero el esquema no tiene `status`

- Síntomas: `TS2339` en `status` sobre lotes de stock
- Zonas principales:
- `src/utils/reservation/checkAvailability.ts`
- `src/components/pos/*`
- `src/components/home/*`
- `src/components/home/ui/widget/StockAssignmentWidget.tsx`

3. Archivo de interfaz duplicado por mayúsculas y minúsculas (`ReservationDTO`)

- Síntomas: `TS1149`
- Estado:
- Corregido en esta pasada:
- Importaciones actualizadas a `@/src/interfaces/ReservationDTO`
- Archivo duplicado eliminado `src/interfaces/reservationDTO.ts`

4. La evolución del esquema del dominio no está sincronizada con los mocks

- Síntomas: `TS2739`, `TS2740`, `TS2322`
- Zonas principales:
- `src/mocks/mock.branch.ts`
- `src/mocks/mock.bussines_rules.ts`
- `src/mocks/mock.inventoryItem.ts`
- `src/mocks/mock.promotions.ts`
- `src/mocks/mocks.product.ts`

5. Desviación de la firma de API/tipo en casos de uso/servicios

- Síntomas: `TS2305`, `TS2345`, `TS2353`, `TS2739`
- Zonas principales:
- `src/services/processReturn.ts` (importación de `StockStatus`)
- `src/services/use-cases/addClientCredit.usecase.ts`
- `src/services/use-cases/manageLoyaltyPoints.ts`
- `src/services/use-cases/converterReservation.usecase.ts`
- `src/services/use-cases/createClient.usecase.ts`

6. Errores en la configuración de la app/compilación

- Síntomas: `TS2307`
- Zonas principales:
- Faltan entradas de la app en `.next/types/validator.ts`
- Falta `prisma.config.ts` en `prisma/config`
- Falta la importación de componentes en `src/app/(all)/boleta/page.tsx`

## 2) Orden de ejecución recomendado

1. Finalizar el cambio de nombre de `size/color` -> `sizeId/colorId` en la interfaz de usuario y simulaciones.
2. Definir un modelo para los lotes de stock:

- Opción A: Añadir `status` al esquema de lote y la tienda.

Opción B: Eliminar todas las comprobaciones de `.status` en lotes y usar solo cantidad/marcadores. 3. Normalizar todos los simulacros con los esquemas zod actuales. 4. Corregir contratos de servicio/caso de uso (`StockStatus`, créditos, fidelización, convertidor). 5. Volver a ejecutar `tsc` y solo entonces solucionar los problemas de entrada de la aplicación/compilación.

## 3) Completado en esta pasada

1. Se añadió la validación de conflictos de reserva en el modal de reserva del TPV:

- Bloquea la acción de confirmación cuando hay conflictos de fecha/stock
- Muestra la lista de conflictos en la interfaz de usuario

2. Corrección de la reserva del calendario ya aplicada en la pasada anterior:

- Corregir propiedades (`sizeId/colorId`) y gestión de cantidad
- El calendario del TPV ahora recibe artículos del carrito de alquiler

3. Se eliminó la duplicación de mayúsculas y minúsculas de `ReservationDTO`.
