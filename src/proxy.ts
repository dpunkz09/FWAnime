import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

const DEVICE_COOKIE = "fw_device_id";
// 1 year in seconds
const MAX_AGE = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // If device cookie doesn't exist yet, create one
  if (!request.cookies.get(DEVICE_COOKIE)) {
    response.cookies.set(DEVICE_COOKIE, uuidv4(), {
      maxAge: MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: false, // needs to be readable by client JS for API calls
    });
  }

  return response;
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
