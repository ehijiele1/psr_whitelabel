import { type NextRequest } from 'next/server';
import { updateSession } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - no auth required
  const publicRoutes = [
    '/login',
    '/apply',
    '/invite',
    '/api/webhooks',
    '/_next',
    '/favicon.ico',
    '/manifest.json',
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(route) || pathname === '/'
  );

  if (isPublicRoute) {
    return;
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-*).*)',
  ],
};