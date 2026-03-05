import { z } from "zod";

export const reservationFormSchema = z.object({
  startDate: z.date({
    error   : "La fecha de inicio es necesaria.",
  }),
  endDate: z.date({
    error   : "La fecha de devolución es necesaria.",
  }),
});

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;
