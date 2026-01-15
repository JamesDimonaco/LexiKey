import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher(["/server"]);

// Clerk middleware with custom www redirect logic
export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Redirect www to non-www (canonical domain is lexikey.org, not www.lexikey.org)
  // This runs before route protection
  if (hostname.startsWith("www.")) {
    const newHostname = hostname.replace("www.", "");
    const redirectUrl = new URL(url.pathname + url.search, `https://${newHostname}`);
    return NextResponse.redirect(redirectUrl, 308); // Permanent redirect
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
