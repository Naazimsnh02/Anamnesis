import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Named proxy.ts (not middleware.ts) because this project is on Next.js 16+,
// which renamed Middleware to Proxy. Contents are identical to what would be
// middleware.ts on Next.js 15 and below.

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

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
