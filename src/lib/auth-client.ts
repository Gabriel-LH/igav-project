import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { toast } from "sonner";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,

  allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],

  additionalFields: {
    user: {
      globalRole: {
        type: "string",
        required: false,
      },
      tenantId: { type: "string" },
      status: {
        type: "string",
        required: false,
      },
    },
  },

  plugins: [emailOTPClient()],
});

export const signInEmail = async (credentials: {
  email: string;
  password: string;
  rememberMe?: boolean;
  callbackURL?: string;
}) => {
  const { data, error } = await authClient.signIn.email({
    email: credentials.email,
    password: credentials.password,
    rememberMe: credentials.rememberMe,
    callbackURL: credentials.callbackURL ?? process.env.NEXT_PUBLIC_APP_URL!,
  });

  return { data, error };
};

export const signUpEmail = async (credentials: {
  name: string;
  email: string;
  password: string;
  image?: string;
}) => {
  const { error } = await authClient.signUp.email({
    ...credentials,
  });

  if (error) throw error;

  await sendVerificationOtp(credentials.email);
};

export const sendVerificationOtp = async (email: string) => {
  const { error } = await authClient.emailOtp.sendVerificationOtp({
    email,
    type: "email-verification",
  });

  if (error) {
    toast.error("Error al enviar el código de verificación", {
      style: {
        backgroundColor: "rgba(255, 0, 0, 0.2)",
      },
    });
    throw error;
  }

  toast.success("Te enviamos un código de verificación", {
    style: {
      backgroundColor: "rgba(0, 255, 0, 0.2)",
    },
  });
};

export const verifyEmailOtp = async (credentials: {
  email: string;
  otp: string;
}) => {
  const { data, error } = await authClient.emailOtp.verifyEmail({
    email: credentials.email,
    otp: credentials.otp,
  });

  if (error) {
    toast.error("Código incorrecto", {
      style: {
        backgroundColor: "rgba(255, 0, 0, 0.2)",
      },
    });
    throw error;
  }

  toast.success("¡Cuenta verificada!", {
    style: {
      backgroundColor: "rgba(0, 255, 0, 0.2)",
    },
  });

  return data;
};
