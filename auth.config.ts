import type { NextAuthConfig } from "next-auth";

// Edge-safe base config (no Prisma/bcrypt) — shared by middleware and the full
// server-side auth. The Credentials provider is added in auth.ts.
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.firstName = user.firstName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string | undefined) ?? "MEMBER";
        session.user.firstName = (token.firstName as string | undefined) ?? "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
