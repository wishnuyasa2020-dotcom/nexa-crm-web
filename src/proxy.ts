import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/siswa',
  '/sekolah',
  '/tasks',
  '/weekly',
  '/home-visit',
  '/broadcast',
  '/nurturing',
  '/snooze-campaign',
  '/live-chat',
  '/templates',
  '/panduan',
  '/manajemen-periode',
  '/manajemen-tim',
  '/settings',
];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('nexa_token')?.value;
  const { pathname, searchParams } = request.nextUrl;

  // 1. Tangani entrypoint form sosialisasi publik pada root (/?sekolahId=...)
  // Diproses sebelum pengecekan auth agar user yang login tidak ter-hijack ke /dashboard saat membuka link form publik
  if (pathname === '/' && searchParams.has('sekolahId')) {
    return NextResponse.redirect(new URL(`/public/form-siswa?${searchParams.toString()}`, request.url));
  }

  const isAuthPage = pathname === '/login' || pathname === '/';
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // 2. Jika tidak ada token dan mengakses halaman protected → redirect ke login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Jika sudah ada token dan akses ke login/root biasa → redirect ke dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 4. Jika root diakses tanpa token dan tanpa sekolahId → redirect ke login
  if (pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/siswa/:path*',
    '/sekolah/:path*',
    '/tasks/:path*',
    '/weekly/:path*',
    '/home-visit/:path*',
    '/broadcast/:path*',
    '/nurturing/:path*',
    '/snooze-campaign/:path*',
    '/live-chat/:path*',
    '/templates/:path*',
    '/panduan/:path*',
    '/manajemen-periode/:path*',
    '/manajemen-tim/:path*',
    '/settings/:path*',
  ],
};

