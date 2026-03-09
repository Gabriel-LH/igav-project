// src/components/signup/signup_form.tsx
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
import { LoaderIcon } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LockPasswordIcon,
  Mail01Icon,
  User03Icon,
  ViewOffIcon,
  ViewIcon,
  Building03Icon,
  City03Icon,
  StoreLocation02Icon,
  SmartPhone03Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
// import { signUpEmail } from "@/src/lib/auth-client";
import { toast } from "sonner";
// import { useRegisterStore } from "@/src/store/login/login-store";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
// import { useVerifyStore } from "@/src/store/verify-email/verify-store";

export function SignupForm({ ...props }: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registered, setRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  const [isActive, setIsActive] = useState("account");

  const router = useRouter();

  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  //   const registerStore = useRegisterStore();

  //   const emailStore = useVerifyStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // evita doble click

    setIsLoading(true);

    // Validación rápida en cliente
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres", {
        style: { backgroundColor: "rgba(255, 0, 0, 0.2)" },
      });
      setIsLoading(false);
      return;
    } else if (!pattern.test(email)) {
      toast.error("Combina entre simbolos, letras y números", {
        style: { backgroundColor: "rgba(255, 0, 0, 0.2)" },
      });
      setIsLoading(false);
      return;
    }

    //     try {
    //       await signUpEmail({ name: name.trim(), email: email.toLowerCase().trim(), password });
    //       registerStore.setCredentials(email.toLowerCase().trim(), password);
    //       emailStore.setEmailVerify(email.toLowerCase().trim());
    //       setRegistered(true);
    //     } catch (err) {
    //       const error = err as Error; // Cast 'err' to Error type

    //       const message =
    //         error.message.includes("already exists")
    //           ? "Este correo ya está registrado"
    //           : "Error al crear la cuenta";

    //       toast.error(message, {
    //         style: { backgroundColor: "rgba(255, 0, 0, 0.2)" },
    //       });
    //     } finally {
    //       setIsLoading(false);
    //     }
    //   };
  };

  useEffect(() => {
    if (registered && email) {
      router.push("/auth/verify-email");
    }
  }, [registered, email, router]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4 border rounded-lg backdrop-blur-lg py-4">
        <div className=" flex flex-col text-center mb-6">
          <span className={`text-2xl font-bold italic tracking-widest`}>
            CREA TU CUENTA
          </span>
          <span className=" text-slate-400">
            Únete para empezar a gestionar.
          </span>
        </div>

        <div>
          <Tabs value={isActive} onValueChange={setIsActive}>
            <div className="flex w-full justify-center mb-5">
              <TabsList className="bg-accent/40">
                <TabsTrigger value="account">
                  <HugeiconsIcon icon={User03Icon} strokeWidth={2} />
                  Usted
                </TabsTrigger>
                <TabsTrigger value="bussines">
                  <HugeiconsIcon icon={Building03Icon} />
                  Sucursal
                </TabsTrigger>
              </TabsList>
            </div>

            <FieldGroup>
              <TabsContent value="bussines">
                <Field>
                  <FieldLabel htmlFor="branchName">
                    Nombre de la sucursal/negocio
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="branchName"
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="Ingrese el nombre"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={Building03Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 "
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="city">Ciudad</FieldLabel>
                  <div className="relative">
                    <Input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ingrese la ciudad"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={City03Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 "
                    />
                  </div>
                </Field>

                {/* === CAMPO: CORREO ELECTRÓNICO === */}
                <Field>
                  <FieldLabel htmlFor="location">Ubicación</FieldLabel>
                  <div className="relative">
                    <Input
                      id="location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ingrese la ubicación"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={StoreLocation02Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">Telefono</FieldLabel>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ingrese el numero de telefono"
                      required
                      className="pl-10 pr-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={SmartPhone03Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    />
                  </div>
                </Field>
              </TabsContent>

              <TabsContent value="account">
                <Field>
                  <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ingrese su nombre"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={User03Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 "
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="lastName">Apellido completo</FieldLabel>
                  <div className="relative">
                    <Input
                      id="lastName"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ingrese sus apellido"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={User03Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 "
                    />
                  </div>
                </Field>

                {/* === CAMPO: CORREO ELECTRÓNICO === */}
                <Field>
                  <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="m@ejemplo.com"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={Mail01Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirm-password">Contraseña</FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="●●●●●●●●"
                      required
                      className="pl-10 pr-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={LockPasswordIcon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3  focus:outline-none"
                    >
                      {showPassword ? (
                        <HugeiconsIcon
                          icon={ViewOffIcon}
                          strokeWidth={2}
                          className="h-4 w-4 "
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
                </Field>
              </TabsContent>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoaderIcon
                      role="status"
                      aria-label="Loading"
                      // Usamos 'text-white' o el color adecuado si el botón no lo hereda
                      className="size-4 animate-spin"
                    />
                    {/* El texto va inmediatamente después del icono dentro del span */}
                    <span>Creando cuenta...</span>
                  </span>
                ) : (
                  "Crear cuenta"
                )}
              </Button>

              <FieldDescription className="text-center">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href={"/auth/login"}
                  className="text-primary hover:underline font-medium"
                >
                  Ingresar
                </Link>
              </FieldDescription>
            </FieldGroup>
          </Tabs>
        </div>
      </div>
    </form>
  );
}
