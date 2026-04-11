import { Role } from "@/generated/prisma";
import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import "next-auth";

declare module "next-auth" {
  interface User {
    role?: Role | null;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      onboardingRequired: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: Role;
    onboardingRequired?: boolean;
  }
}
