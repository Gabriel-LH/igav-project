import { Session, User } from "better-auth";

declare module "better-auth" {
  interface User {
    roles: string; // O el tipo que uses (string, string[], etc)
  }
}
