import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  // Check for demo credentials first
  const demoToken = req.cookies.get('groupo_token')?.value;
  const isDemoUser = demoToken && demoToken.startsWith('demo_token_');

  // Allow access to portal pages, home page, and API routes without authentication
  const allowedPaths = [
    '/',
    '/buyer-portal',
    '/manufacturer-portal',
    '/api',
    '/login',
    '/auth'
  ];
  
  const isAllowedPath = allowedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );

  // If it's a demo user or allowed path, let them through
  if (isDemoUser || isAllowedPath) {
    return NextResponse.next({ request: req });
  }

  // For other paths, let Clerk handle authentication
  return NextResponse.next({ request: req });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
