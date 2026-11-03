import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/*
 * Hidden admin panel.
 *  - The panel is only reachable at /<ADMIN_PATH> — a random secret segment set in the
 *    server environment (never shipped to the browser bundle; the backend reveals it only
 *    to signed-in admins).
 *  - The internal route that renders it (/panel-internal) returns 404 when requested directly.
 *  - Even at the secret path, the page renders only for sessions whose email is on the
 *    backend's ADMIN_EMAILS allow-list; every admin API call is checked server-side too.
 */
const INTERNAL = "/panel-internal";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.ADMIN_PATH;

  if (pathname === INTERNAL || pathname.startsWith(`${INTERNAL}/`)) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  }

  if (secret && (pathname === `/${secret}` || pathname.startsWith(`/${secret}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = INTERNAL + pathname.slice(secret.length + 1);
    const res = NextResponse.rewrite(url);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // skip static assets and the API proxy
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|products|brand|cursors).*)"],
};
