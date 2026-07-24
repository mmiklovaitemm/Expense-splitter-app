import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  if (!isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api/auth|api/signup|login|_next/static|_next/image|favicon.ico).*)"],
};
