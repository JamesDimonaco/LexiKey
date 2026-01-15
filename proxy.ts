import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/server"]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;

  // Redirect www to non-www (canonical domain)
  if (url.hostname === "www.lexikey.org") {
    const newUrl = new URL(url.toString());
    newUrl.hostname = "lexikey.org";
    return NextResponse.redirect(newUrl, 308);
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
