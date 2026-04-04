import { auth } from "@/auth";
import { getDefaultPortalPath } from "@/lib/permissions";
import { NextResponse } from "next/server";

function getLoginPath(pathname: string) {
  if (pathname.startsWith("/doctor")) {
    return "/doctor-login";
  }

  if (pathname.startsWith("/admin")) {
    return "/admin-login";
  }

  return "/login";
}

export default auth((request) => {
  const isAuthenticated = Boolean(request.auth?.user);
  const role = request.auth?.user?.role;
  const pathname = request.nextUrl.pathname;

  if (!isAuthenticated) {
    const loginUrl = new URL(getLoginPath(pathname), request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(getDefaultPortalPath(role), request.url));
  }

  if (pathname.startsWith("/doctor") && role !== "DOCTOR" && role !== "ADMIN") {
    return NextResponse.redirect(new URL(getDefaultPortalPath(role), request.url));
  }

  if (pathname.startsWith("/elderly-portal") && role !== "ELDERLY") {
    return NextResponse.redirect(new URL(getDefaultPortalPath(role), request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/doctor/:path*",
    "/admin/:path*",
    "/elderly/:path*",
    "/elderly-portal/:path*",
  ],
};
