export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!api/auth|share|login|register|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
