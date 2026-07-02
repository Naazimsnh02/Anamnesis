import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Named proxy.ts (not middleware.ts) because this project is on Next.js 16+,
// which renamed Middleware to Proxy. Contents are identical to what would be
// middleware.ts on Next.js 15 and below.

// The marketing landing page ("/") is public so judges and visitors can see it
// without signing in. Everything else (the app surfaces, e.g. /debug) stays
// protected. Sign-in/up handled via Clerk modal from the landing nav.
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
