"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { sendVerificationOtp } from "@/src/lib/auth-client";
import { useVerifyStore } from "@/src/store/tenant/verify-email/verify-store"; 

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MailSend01Icon,
  MailValidation02Icon,
} from "@hugeicons/core-free-icons";
import { Loader, RefreshCw } from "lucide-react";
import { InputOTPForm } from "../ui/InputOTPForm"; 

interface ResendEmailProps {
  className?: string;
}

const RESEND_TIMEOUT_SECONDS = 60;

export function VerifyEmailForm({ className }: ResendEmailProps) {
  const email = useVerifyStore((state) => state.email);

  console.log(email);

  const router = useRouter();

  const [secondsLeft, setSecondsLeft] = useState(RESEND_TIMEOUT_SECONDS);

  // Estado para deshabilitar el botón (combinación de resending y secondsLeft > 0)
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [resending, setResending] = useState(false);


  useEffect(() => {

      if (!email) {
        router.push("/auth/login");
        return;
  }
    // Si ya terminó el conteo, no hacemos nada más
    if (secondsLeft === 0) {
      setIsCountingDown(false);
      return;
    }

    // Crear el intervalo
    const timer = setInterval(() => {
      setSecondsLeft((prevSeconds) => prevSeconds - 1);
    }, 1000);

    // Limpiar el intervalo al desmontar el componente o cuando secondsLeft cambie
    return () => clearInterval(timer);
  }, [email, router, secondsLeft]);
  // El efecto se ejecuta cada vez que secondsLeft cambia (cada segundo)

  const handleResend = async () => {
    setResending(true);
    setIsCountingDown(true); // Reiniciar el estado de conteo
    setSecondsLeft(RESEND_TIMEOUT_SECONDS); // Reiniciar el contador
    try {
      await sendVerificationOtp(email);
      toast.success("Código de verificación reenviado", {
        style: {
          backgroundColor: "rgba(0, 255, 0, 0.2)",
        },
      });
    } catch (err: any) {
      toast.error("Error al reenviar: " + err.message, {
        style: {
          backgroundColor: "rgba(255, 0, 0, 0.2)",
        },
      });
      setIsCountingDown(false);
    } finally {
      setResending(false);
    }
  };

  const isDisabled = resending || isCountingDown;

  // Función para formatear el tiempo restante
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

    // Si es menos de 60 segundos, mostramos solo segundos.
    if (minutes === 0) {
      return formattedSeconds;
    }
    return `${minutes}:${formattedSeconds}`;
  };

  if (!email) {
   
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                
                <Loader size={40} className="animate-spin"/>
                <p>Regresando al login...</p>

            </div>
        );
    }

  return (
    <div className={cn("flex flex-col gap-6 w-100", className)}>
      <Card className="border-none backdrop-blur-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <HugeiconsIcon
              icon={MailValidation02Icon}
              className="h-10 w-10 text-green-600 dark:text-green-400 animate-pulse"
            />
          </div>
          <CardTitle className="text-2xl">Revisa tu correo</CardTitle>
          <CardDescription className="grid place-items-center text-base ">
            Te hemos enviado un codigo de verificación a:
            <div className="grid place-items-center mt-2 text-white pr-3 pl-3 rounded-md h-8 w-fit bg-[#34343480] shadow-xl/80 backdrop-blur:20">
              {email}
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <InputOTPForm email={email} />
          <Button
            onClick={handleResend}
            disabled={isDisabled} // Usamos el estado combinado
            className="w-full bg-[#48380080] hover:bg-[#59490080] border text-white"
          >
            {resending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : isCountingDown ? (
              <>
                <HugeiconsIcon
                  icon={MailSend01Icon}
                  strokeWidth={2}
                  className="mr-2 h-4 w-4"
                />
                Reenviar código en: {formatTime(secondsLeft)}s
              </>
            ) : (
              <>
                <HugeiconsIcon
                  icon={MailSend01Icon}
                  strokeWidth={2}
                  className="mr-2 h-4 w-4"
                />
                Reenviar código
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Revisa también la carpeta de Spam o Promociones
          </p>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/auth/login")}
          >
            Volver al login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}