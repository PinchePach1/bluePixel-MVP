import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    tenantId?: string;
    organizationName?: string;
  }
  interface Session {
    user: {
      role?: string;
      tenantId?: string;
      organizationName?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    tenantId?: string;
    organizationName?: string;
  }
}