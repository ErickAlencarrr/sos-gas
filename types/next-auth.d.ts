import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EMPLOYEE";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "ADMIN" | "EMPLOYEE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "EMPLOYEE";
  }
}
