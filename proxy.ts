import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher(["/server"]);

const CLERK_PROXY_PATH = "/__clerk";

// Clerk's script loads from its own domain by default, which some school
// filters and browser blockers stop, leaving Sign Up dead. Serving it from our
// own origin avoids that. The browser only uses it once the proxy is enabled
// in the Clerk dashboard and NEXT_PUBLIC_CLERK_PROXY_URL is set.
function proxyClerkFrontendApi(req: NextRequest) {
  const headers = new Headers(req.headers);
  // Falls back to this origin so Clerk's dashboard check passes before the
  // env var exists; afterwards every host reports the one registered URL.
  headers.set(
    "Clerk-Proxy-Url",
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL ||
      `${req.nextUrl.origin}${CLERK_PROXY_PATH}`,
  );
  headers.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY ?? "");

  const target = new URL(req.url);
  target.protocol = "https";
  target.host = "frontend-api.clerk.dev";
  target.port = "";
  target.pathname = target.pathname.slice(CLERK_PROXY_PATH.length) || "/";

  return NextResponse.rewrite(target, { request: { headers } });
}

const withClerk = clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;

  // Redirect /practice to / (practice is on the home page)
  if (url.pathname === "/practice") {
    return NextResponse.redirect(new URL("/", url), 308);
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  if (req.nextUrl.pathname.startsWith(`${CLERK_PROXY_PATH}/`)) {
    return proxyClerkFrontendApi(req);
  }
  return withClerk(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk's scripts end in .js, which the first pattern skips
    "/__clerk/(.*)",
  ],
};
