import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicPath = path === "/login" || path.startsWith("/api/auth");

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev_only",
  });

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  if (token) {
    const role = token.role as string;

    if (path.startsWith("/users") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
    if (path.startsWith("/settings") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
    if (path === "/projects/new" && role !== "admin") {
      return NextResponse.redirect(new URL("/projects", request.nextUrl));
    }

    if (path.startsWith("/api/users") && role !== "admin" && !path.includes("/change-password")) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/projects/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/login",
    "/api/:path*",
  ],
};
