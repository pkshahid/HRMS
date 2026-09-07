export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints including reset-password, activate)
     * - login, forgot-password, reset-password, activate (public auth pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo, etc.
     */
    "/((?!api/auth|login|forgot-password|reset-password|activate|_next/static|_next/image|favicon.ico|logo).*)",
  ],
};
