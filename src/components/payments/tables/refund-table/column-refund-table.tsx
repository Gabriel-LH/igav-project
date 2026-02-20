"use client";

import { Row, type ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { DragHandle } from "@/src/components/dashboard/data-table/ui/DragHandle";
import { paymentTableSchema } from "../../type/type.payments";
import {
  ArrowUpDown,
  BadgeCheck,
  BadgeMinus,
  BadgeX,
  CircleDashed,
  Wallet,
} from "lucide-react";
import { TableCellViewerRefund } from "./refund-table-cell-viewer";
import {
  BankIcon,
  CreditCardIcon,
  SmartPhone02Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const columnsPaymentRefund: ColumnDef<
  z.infer<typeof paymentTableSchema>
>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={Number(row.original.id)} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cliente
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <TableCellViewerRefund item={row.original} />,
  },
  {
    accessorKey: "operationType",
    header: "Tipo de Operacion",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "receivedBy",
    header: "Recibido por",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "amount",
    header: "Monto",
    cell: ({ getValue }) => <div className="w-32">{getValue<number>()}</div>,
  },
  {
    accessorKey: "paid",
    header: "Pagado",
    cell: ({ getValue }) => <div className="w-32">{getValue<number>()}</div>,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ getValue }) => {
      const type = getValue() as string;
      return (
        <div className="w-32">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {type === "pendiente" ? (
              <CircleDashed />
            ) : type === "completado" ? (
              <BadgeCheck />
            ) : type === "anulado" ? (
              <BadgeX />
            ) : (
              <BadgeMinus />
            )}
            {type.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Fecha de pago",
    cell: ({ getValue }) => (
      <div className="w-32">{getValue<Date>().toLocaleDateString()}</div>
    ),
  },
  {
    accessorKey: "method",
    header: "Metodo de pago",
    cell: ({ getValue }) => {
      const type = getValue() as string;
      return (
        <div className="w-32">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {type === "cash" ? (
              <HugeiconsIcon icon={Wallet01Icon} strokeWidth={3} />
            ) : type === "card" ? (
              <HugeiconsIcon icon={CreditCardIcon} strokeWidth={3} />
            ) : type === "transfer" ? (
              <HugeiconsIcon icon={BankIcon} strokeWidth={3} />
            ) : (
              <HugeiconsIcon icon={SmartPhone02Icon} strokeWidth={3} />
            )}
            {type.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      );
    },
  },

  {
    id: "actions",
    cell: ({ row }) => <ActionCell row={row} />,
  },
];

function ActionCell({ row }: { row: Row<z.infer<typeof paymentTableSchema>> }) {
  return <div></div>;
  //   const [openCancel, setOpenCancel] = useState(false);
  //   const [openDeliver, setOpenDeliver] = useState(false);

  //   const item = row.original;

  //   const { rentals, rentalItems } = useRentalStore();

  //   const baseRental = rentals.find((rental) => rental.id === item.id);

  //   const itemsOfRental = rentalItems.filter(
  //     (rentalItem) => rentalItem.rentalId === item.id,
  //   );

  //   const fullRentalData: RentalWithItems | undefined = baseRental
  //     ? {
  //         ...baseRental,
  //         items: itemsOfRental,
  //       }
  //     : undefined;

  //   const handleConfirm = async (rentalId: string, reason: string) => {
  //     try {
  //       await cancelRentalTransaction(rentalId, reason);
  //       toast.success("Alquiler cancelado exitosamente");
  //       setOpenCancel(false);
  //     } catch (error) {
  //       toast.error("Error al cancelar el alquiler");
  //     }
  //   };

  //   if (!fullRentalData) return null;

  //   const handleDeliverRental = async (id: string, guaranteeData: { type: GuaranteeType; value: string }) => {
  //     try {
  //       await deliverRentalUseCase(id, guaranteeData);

  //       toast.success("Alquiler entregado", {
  //         description: "El alquiler fue entregado correctamente",
  //       });
  //       setOpenDeliver(false);
  //     } catch (error) {
  //       toast.error("No se pudo entregar", {
  //         description: (error as Error).message,
  //       });
  //     }
  //   };

  //   return (
  //     <>
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button
  //             variant="ghost"
  //             className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
  //             size="icon"
  //           >
  //             <IconDotsVertical />
  //             <span className="sr-only">Open menu</span>
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end" className="w-32">
  //           <DropdownMenuItem onClick={() => setOpenDeliver(true)}>
  //             <Handbag className="animate-pulse" /> Entregar
  //           </DropdownMenuItem>
  //           <DropdownMenuSeparator />
  //           <DropdownMenuItem
  //             variant="destructive"
  //             onClick={() => setOpenCancel(true)}
  //           >
  //             <BadgeX className="animate-pulse" /> Anular
  //           </DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>

  //       <CancelRentalModal
  //         open={openCancel}
  //         onOpenChange={setOpenCancel}
  //         rental={fullRentalData}
  //         onConfirm={handleConfirm}
  //       />
  //       <DeliverRentalModal
  //         open={openDeliver}
  //         onOpenChange={setOpenDeliver}
  //         rental={fullRentalData}
  //         onConfirm={handleDeliverRental}
  //       />
  //     </>
  //   );
}
