import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
const COOKIE_NAME = "tms_token";

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Resolve current session: prefer httpOnly cookie, fall back to Bearer token.
 * The Bearer path is what the future mobile app uses.
 */
async function getCookie(name) {
  const store = await cookies();
  return store.get(name)?.value;
}

export async function getSession({ token } = {}) {
  let authToken = token;
  if (!authToken) {
    authToken = await getCookie(COOKIE_NAME);
  }
  if (!authToken) return null;
  const payload = await verifyToken(authToken);
  if (!payload) return null;
  return payload; // { sub, role, tenantId, name }
}

/**
 * Wrap an API route handler with authentication + RBAC.
 * roles: array of allowed roles, e.g. ["admin"] or ["admin","superadmin"].
 */
export function withAuth(handler, roles = []) {
  return async (req, ctx) => {
    try {
      // resolve token from Authorization header, else cookie
      const authHeader = req.headers.get("authorization") || "";
      let token = null;
      if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7);
      if (!token) token = await getCookie(COOKIE_NAME);

      const session = token ? await verifyToken(token) : null;
      if (!session) {
        return Response.json({ error: "Unauthorized — please log in." }, { status: 401 });
      }
      if (roles.length && !roles.includes(session.role)) {
        return Response.json({ error: "Forbidden — you do not have access." }, { status: 403 });
      }
      req.session = session;
      return handler(req, ctx);
    } catch (err) {
      console.error("withAuth error:", err);
      return Response.json({ error: "Server error." }, { status: 500 });
    }
  };
}

/** Returns a 403 Response if session role is not allowed, else null. */
export function requireRole(req, roles) {
  if (roles && roles.length && !roles.includes(req.session.role)) {
    return Response.json({ error: "Forbidden — you do not have access." }, { status: 403 });
  }
  return null;
}

export const setAuthCookie = (token) => {
  return {
    [COOKIE_NAME]: token,
  };
};

export function clearAuthCookie() {
  return {
    [COOKIE_NAME]: "",
  };
}

export { COOKIE_NAME };