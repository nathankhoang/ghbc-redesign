import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const MEMBER_ROUTES = ["/profile", "/schedule", "/account"];
const ADMIN_ROUTES = ["/admin"];

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  if (ADMIN_ROUTES.some((p) => path.startsWith(p))) {
    if (!isLoggedIn)
      return Response.redirect(new URL("/login", nextUrl));
    if (role !== "OWNER")
      return Response.redirect(new URL("/profile", nextUrl));
    return;
  }

  if (MEMBER_ROUTES.some((p) => path.startsWith(p)) && !isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }
});

export const config = {
  matcher: [
    "/profile/:path*",
    "/schedule/:path*",
    "/account/:path*",
    "/admin/:path*",
  ],
};
