"use client";

import { Row, type ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { DragHandle } from "@/src/components/dashboard/data-table/ui/DragHandle";
import { clientActiveSchema } from "../type/type.active";
import {
  ArrowUpDown,
  BadgeCheck,
} from "lucide-react";
import { TableCellViewerActive } from "./active-table-cell-viewer";



export const columnsClientActive: ColumnDef<
  z.infer<typeof clientActiveSchema>
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
    accessorKey: "userName",
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
    cell: ({ row }) => <TableCellViewerActive item={row.original} />,
  },
  {
    accessorKey: "dni",
    header: "DNI",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "phone",
    header: "Telefono",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "address",
    header: "Direccion",
    cell: ({ getValue }) => <div className="w-32">{getValue<string>()}</div>,
  },
  {
    accessorKey: "walletBalance",
    header: "Saldo a Favor",
    cell: ({ getValue }) => <div className="w-32">{getValue<number>()}</div>,
  },
  {
    accessorKey: "loyaltyPoints",
    header: "Puntos de Lealtad",
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
            {type === "active" && <BadgeCheck />}
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

function ActionCell({ row }: { row: Row<z.infer<typeof clientActiveSchema>> }) {
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
