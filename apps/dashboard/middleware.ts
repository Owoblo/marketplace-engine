import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const username = process.env.DASHBOARD_USERNAME;
  const password = process.env.DASHBOARD_PASSWORD;
  const repUsername = process.env.DASHBOARD_REP_USERNAME;
  const repPassword = process.env.DASHBOARD_REP_PASSWORD;
  if (!username || !password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Dashboard authentication is not configured", { status: 503 });
    }
    return NextResponse.next();
  }

  const supplied = request.headers.get("authorization");
  if (supplied?.startsWith("Basic ")) {
    const decoded = atob(supplied.slice(6));
    const separator = decoded.indexOf(":");
    if (separator >= 0) {
      const suppliedUsername=decoded.slice(0,separator),suppliedPassword=decoded.slice(separator+1);
      const headers=new Headers(request.headers);
      if(suppliedUsername===username&&suppliedPassword===password){headers.set("x-marketplace-role","ADMIN");return NextResponse.next({request:{headers}})}
      if(repUsername&&repPassword&&suppliedUsername===repUsername&&suppliedPassword===repPassword){
        if(request.nextUrl.pathname!=="/outreach")return NextResponse.redirect(new URL("/outreach",request.url));
        headers.set("x-marketplace-role","MARKETPLACE_REP");headers.set("x-marketplace-user-email",repUsername.toLowerCase());return NextResponse.next({request:{headers}});
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Saturn Star Marketplace Engine"' },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
