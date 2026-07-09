import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/',
  '/login',
  '/api/auth/otp/send',
  '/api/auth/otp/verify',
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    publicPaths.some((p) => pathname === p || pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('lawma_session');
  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
