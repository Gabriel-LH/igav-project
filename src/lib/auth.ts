import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { customSession, jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      globalRole: {
        type: "string",
      },
    },
  },
  plugins: [
    customSession(async ({ user, session }, ctx) => {
      const dbUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          globalRole: true,
          id: true,
        },
      });
      return {
        user: {
          ...user,
          id: dbUser?.id,
          globalRole: dbUser?.globalRole || ["no-roles"],
        },
        session,
      };
    }),

    jwt({
      jwt: {
        expirationTime: "1h",
        definePayload: ({ user, session }) => {
          return {
            id: user.id,
            globalRole: user.globalRole,
          };
        },
      },
    }),
    nextCookies(),
  ],
});
