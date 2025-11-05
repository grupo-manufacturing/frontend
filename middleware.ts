import { NextResponse, type NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL;

export default async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  const token = request.cookies.get('groupo_token')?.value;
  const isDemoUser = token && token.startsWith('demo_token_');

  // Protected portal routes
  const isPortal = pathname.startsWith('/buyer-portal') || pathname.startsWith('/manufacturer-portal');

  // Always allow portal pages to render (they contain their own auth flows)
  if (isPortal) {
    // Try silent verify/refresh but do not block navigation
    if (token && API_BASE_URL && !isDemoUser) {
      try {
        const verifyRes = await fetch(`${API_BASE_URL}/auth/verify-token`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!verifyRes.ok) {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (refreshRes.ok) {
            const json = await refreshRes.json();
            const newToken = json?.data?.token;
            const response = NextResponse.next();
            if (newToken) {
              response.cookies.set('groupo_token', newToken, {
                path: '/',
                httpOnly: false,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24
              });
            }
            return response;
          }
        }
      } catch (_) {
        // ignore
      }
    }
    return NextResponse.next();
  }

  // Non-portal paths pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
