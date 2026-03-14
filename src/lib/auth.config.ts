import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const role = (auth?.user as { role?: string } | undefined)?.role;

      const isOnLoginPage = pathname === "/admin/login";
      const isOnAdmin = pathname.startsWith("/admin");
      const isOnDriver = pathname.startsWith("/driver");

      // Login page: redirect logged-in users to their portal
      if (isOnLoginPage) {
        if (isLoggedIn) {
          if (role === "DRIVER") {
            return Response.redirect(new URL("/driver", request.nextUrl));
          }
          return Response.redirect(new URL("/admin", request.nextUrl));
        }
        return true;
      }

      // Admin routes: require ADMIN or SUPER_ADMIN
      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        if (role === "DRIVER") {
          return Response.redirect(new URL("/driver", request.nextUrl));
        }
        return true;
      }

      // Driver routes: require DRIVER role
      if (isOnDriver) {
        if (!isLoggedIn) return false;
        if (role !== "DRIVER") {
          return Response.redirect(new URL("/admin", request.nextUrl));
        }
        return true;
      }

      return true;
    },
  },
  providers: [], // Providers added in auth.ts (server-only)
} satisfies NextAuthConfig;
