import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("nodoos-admin-session")?.value;
  const path = request.nextUrl.pathname;

  // Protect all /dashboard/* and /onboarding/* routes
  if (path.startsWith("/dashboard") || path.startsWith("/onboarding")) {
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth";
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from /auth
  if (path === "/auth" && token) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|nodoos-logo.png|icon-google.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
