import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('nexa_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/';
  const isProtected = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/siswa') ||
    pathname.startsWith('/sekolah') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/weekly') ||
    pathname.startsWith('/home-visit') ||
    pathname.startsWith('/nurturing') ||
    pathname.startsWith('/broadcast') ||
    pathname.startsWith('/templates');

  // Jika tidak ada token dan akses ke halaman protected → redirect ke login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah ada token dan akses ke login → redirect ke dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/siswa/:path*', '/sekolah/:path*',
    '/tasks/:path*', '/weekly/:path*', '/home-visit/:path*',
    '/nurturing/:path*', '/broadcast/:path*', '/templates/:path*'],
};
