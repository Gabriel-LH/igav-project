"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useState } from "react";
import { LoaderIcon } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge03Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";

import { signInEmail, verifyEmailOtp } from "@/src/lib/auth-client";
import { useRegisterStore } from "@/src/store/tenant/login/login-store";
import { useVerifyStore } from "@/src/store/tenant/verify-email/verify-store";

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: "Por favor, completa los 6 campos.",
  }),
});

export function InputOTPForm({ email }: { email: string }) {
  const router = useRouter();

  const [isLoading, setLoading] = useState(false);

  const { password, clear } = useRegisterStore();

  const { clearEmail } = useVerifyStore();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setLoading(true);

      // 1️⃣ Verificar OTP
      const { status } = await verifyEmailOtp({
        email: email,
        otp: data.pin,
      });

      if (status) {
        await signInEmail({
          email,
          password,
        });
        clear();
        clearEmail();

        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      toast.error("Código incorrecto o expirado", {
        style: { backgroundColor: "rgba(255,0,0,0.2)" },
      });
      clear();
      clearEmail();
    } finally {
      setLoading(false);
      clear();
      clearEmail();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormLabel>Codigo de verificaion.</FormLabel>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  id="otp"
                  required
                  {...field}
                  onChange={(value) => {
                    field.onChange(value);
                    if (value.length === 6) {
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                >
                  <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormDescription>
                Ingrese el codigo que enviamos a tu correo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#05660080] hover:bg-[#05880080] border text-white"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <LoaderIcon
                role="status"
                aria-label="Loading"
                // Usamos 'text-white' o el color adecuado si el botón no lo hereda
                className="size-4 animate-spin"
              />
              {/* El texto va inmediatamente después del icono dentro del span */}
              <span>Verificando...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <HugeiconsIcon icon={CheckmarkBadge03Icon} strokeWidth={2} />
              {/* El texto va inmediatamente después del icono dentro del span */}
              <span>Verificar</span>
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
