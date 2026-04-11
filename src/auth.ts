import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@/generated/prisma";
import { hasCompletedGeneralProfile, ensureElderlyProfileForUser } from "@/lib/elderly-profile";
import { canLoginToPortal } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { loginSchema } from "@/lib/validations";

const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);
const facebookEnabled = Boolean(
  process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET,
);

async function syncOAuthElderlyUser(userId?: string, email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();
  const dbUser = userId
    ? await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          elderlyProfile: true,
        },
      })
    : normalizedEmail
      ? await prisma.user.findUnique({
          where: {
            email: normalizedEmail,
          },
          include: {
            elderlyProfile: true,
          },
        })
      : null;

  // Let first-time OAuth sign-ins continue so the adapter can create the user.
  // If a matching account already exists, we still enforce the elderly portal role.
  if (!dbUser) {
    return true;
  }

  if (dbUser.role !== Role.ELDERLY) {
    return false;
  }

  const profile =
    dbUser.elderlyProfile ?? (await ensureElderlyProfileForUser(dbUser.id));
  const needsCompletion = !hasCompletedGeneralProfile(profile);

  if (profile.onboardingRequired !== needsCompletion) {
    await prisma.elderlyProfile.update({
      where: {
        id: profile.id,
      },
      data: {
        onboardingRequired: needsCompletion,
        profileCompletedAt:
          needsCompletion ? null : profile.profileCompletedAt ?? new Date(),
      },
    });
  }

  return true;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: {},
        password: {},
        portal: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        if (!canLoginToPortal(user.role, parsed.data.portal)) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(facebookEnabled
      ? [
          Facebook({
            clientId: process.env.AUTH_FACEBOOK_ID!,
            clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true;
      }

      return syncOAuthElderlyUser(user.id, user.email);
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      const userId = String(token.id ?? token.sub ?? "");

      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            role: true,
            elderlyProfile: {
              select: {
                onboardingRequired: true,
              },
            },
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.onboardingRequired =
            dbUser.elderlyProfile?.onboardingRequired ?? false;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "");
        session.user.role = token.role ?? Role.ELDERLY;
        session.user.onboardingRequired = Boolean(token.onboardingRequired);
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
