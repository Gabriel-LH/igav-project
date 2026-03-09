"use client";

import { Button } from "@/components/ui/button";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LockPasswordIcon,
  Mail01Icon,
  ViewOffIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
// import {
//   requestResetPassword,
//   signInEmail,
//   signInGoogle,
// } from "@/src/lib/auth-client";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoaderIcon } from "lucide-react";
// import { useVerifyStore } from "@/src/store/verify-email/verify-store";
import { useSearchParams } from "next/navigation";
import { ForgotPasswordModal } from "../ui/modal/ForgotPasswordModal";
import { signInEmail } from "@/src/lib/auth-client";
import { useVerifyStore } from "@/src/store/tenant/verify-email/verify-store";
import { validateLoginRouteRoleAction } from "@/src/app/actions/auth-route-guard.action";

export function LoginForm({ ...props }: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // 🔑 NUEVO ESTADO PARA EL CHECKBOX
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const registerStore = useVerifyStore();

  useEffect(() => {
    if (error === "expired") {
      toast.error(
        "El enlace de restablecimiento ha expirado o no es válido. Por favor, solicita uno nuevo.",
        {
          duration: 6000,
          style: { backgroundColor: "rgba(255, 100, 100, 0.2)" },
        },
      );
    } else if (error === "missing_token") {
      toast.error(
        "Enlace de restablecimiento incompleto. Debes usar el enlace completo enviado a tu correo.",
        {
          duration: 6000,
          style: { backgroundColor: "rgba(255, 100, 100, 0.2)" },
        },
      );
    }
  }, [error]); // Dependencia en el parámetro 'error'
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const roleCheck = await validateLoginRouteRoleAction(email, "tenant");
      console.log("Role check", roleCheck);
      if (!roleCheck.allowed) {
        toast.error(roleCheck.message ?? "No autorizado para esta ruta", {
          style: {
            backgroundColor: "rgba(255, 0, 0, 0.2)",
          },
        });
        return;
      }

      const { error } = await signInEmail({
        email,
        password,
        rememberMe,
        callbackURL: "/tenant/home",
      });
      if (error) {
        if (error.status === 403) {
          toast.error("Correo no verificado", {
            style: {
              backgroundColor: "rgba(255, 0, 0, 0.2)",
            },
          });
          registerStore.setEmailVerify(email);
          router.push(`/auth/verify-email`);
          return;
        }

        toast.error("Correo o contraseña incorrectos", {
          style: {
            backgroundColor: "rgba(255, 0, 0, 0.2)",
          },
        });
        return;
      }

      router.replace("/tenant/home");
      router.refresh();
    } catch {
      toast.error("No se pudo iniciar sesión", {
        style: {
          backgroundColor: "rgba(255, 0, 0, 0.2)",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Asegúrate de que los inputs tengan los manejadores onChange
    <form onSubmit={handleSubmit}>
      <div className="px-4 border rounded-lg py-4 backdrop-blur-lg ">
        <div className="text-center flex flex-col mb-10">
          <span className="text-2xl italic tracking-widest font-bold">
            BIENVENIDO
          </span>
          <span className="text-slate-400">
            Ingresa para tener un excelente día
          </span>
        </div>
        <div>
          <FieldGroup>
            {/* <Field>
              <Button
                //   onClick={() => signInGoogle()}
                variant="outline"
                type="button"
                disabled={isLoading} // Deshabilitar si está cargando
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Ingresar con Google
              </Button>
            </Field> */}

            {/* Separador customizado (lo dejamos como antes) */}
            {/* <div className="relative flex items-center">
              <div className="grow border-t border-gray-300 dark:border-gray-400"></div>
              <span className="shrink mx-4 text-sm">O continúa con</span>
              <div className="grow border-t border-gray-300 dark:border-gray-400"></div>
            </div> */}

            {/* === CAMPO EMAIL === */}
            <Field>
              <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="m@ejemplo.com"
                  required
                  className="pl-10 text-sm"
                  value={email} // 🔑 Vinculación de estado
                  onChange={(e) => setEmail(e.target.value)} // 🔑 Manejador de estado
                />
                <HugeiconsIcon
                  icon={Mail01Icon}
                  strokeWidth={2}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                />
              </div>
            </Field>

            {/* === CAMPO CONTRASEÑA === */}
            <Field>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="●●●●●●●●"
                  title="Debe contener mínimo 8 caracteres, una mayúscula, una minúscula y un número."
                  required
                  className="pl-10 text-sm pr-10" // Asegurar espacio para el botón de toggle
                  value={password} // 🔑 Vinculación de estado
                  onChange={(e) => setPassword(e.target.value)} // 🔑 Manejador de estado
                />
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  strokeWidth={2}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none"
                >
                  {showPassword ? (
                    <HugeiconsIcon
                      icon={ViewOffIcon}
                      strokeWidth={2}
                      className="h-5 w-5"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={ViewIcon}
                      strokeWidth={2}
                      className="h-5 w-5"
                    />
                  )}
                </button>
              </div>

              {/* === CHECKBOX Y OLVIDASTE CONTRASEÑA === */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {" "}
                  {/* gap-3 a gap-2 para ser más compacto */}
                  {/* 🔑 CHECKBOX: Actualiza el estado 'rememberMe' */}
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked: boolean) =>
                      setRememberMe(checked)
                    }
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Recuérdame
                  </Label>
                </div>
                <div className="text-right">
                  {/* Reemplazamos el <p> simple con el componente Modal.
            Le pasamos el 'email' actual para que prellene el input.
          */}
                  <ForgotPasswordModal initialEmail={email} />
                </div>
              </div>
            </Field>

            <Field className="pt-4">
              {" "}
              {/* Añadir un poco más de espacio al botón */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoaderIcon
                      role="status"
                      aria-label="Loading"
                      // Usamos 'text-white' o el color adecuado si el botón no lo hereda
                      className="size-4 animate-spin"
                    />
                    {/* El texto va inmediatamente después del icono dentro del span */}
                    <span>Ingresando...</span>
                  </span>
                ) : (
                  "Ingresar"
                )}
              </Button>
              <FieldDescription className="text-center pt-3 text-muted-foreground">
                ¿Aun no te registras?{" "}
                <Link
                  href={"/auth/new-account"}
                  className="text-primary hover:underline font-medium"
                >
                  Empieza gratis
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </div>
      </div>
    </form>
  );
}
