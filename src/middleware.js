import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
const COOKIE = "tms_token";

const ROLE_PATHS = {
  superadmin: "/superadmin",
  admin: "/admin",
  driver: "/driver",
  customer: "/customer",
};

async function sessionOf(req) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const session = await sessionOf(req);

  // Root landing: send to the right panel.
  if (pathname === "/") {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.redirect(new URL(ROLE_PATHS[session.role] + "/dashboard", req.url));
  }

  // find which role zone this path belongs to
  let zone = null;
  for (const [role, prefix] of Object.entries(ROLE_PATHS)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      zone = role;
      break;
    }
  }
  if (!zone) return NextResponse.next();

  const isLoginPage = pathname === `${ROLE_PATHS[zone]}/login`;
  if (isLoginPage) {
    // already signed in -> skip login
    if (session && session.role === zone) {
      return NextResponse.redirect(new URL(ROLE_PATHS[zone] + "/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // protected page
  if (!session || session.role !== zone) {
    return NextResponse.redirect(new URL(ROLE_PATHS[zone] + "/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/superadmin/:path*",
    "/admin/:path*",
    "/driver/:path*",
    "/customer/:path*",
  ],
};