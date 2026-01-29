import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Define public paths that don't require authentication
    const isPublicPath = path === '/login' || path === '/signup' || path === '/';
    // Define API paths (mostly public, but some might be protected individually)
    // We generally let API routes handle their own auth or pass through, 
    // but we definitely don't want to redirect API calls to a login HTML page.
    const isApiPath = path.startsWith('/api/');

    const token = request.cookies.get('token')?.value || '';

    // 1. If trying to access a protected route without a token, redirect to login
    // We exclude API routes from this redirect to avoid 307 redirects on fetch calls
    if (!isPublicPath && !isApiPath && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. If trying to access login/signup while already logged in, redirect to home
    if ((path === '/login' || path === '/signup') && token) {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    return NextResponse.next();
}

// Ensure middleware runs on relevant paths
export const config = {
    matcher: [
        '/',
        '/login',
        '/signup',
        '/home',
        '/note/:path*',
        // Match all paths except those starting with:
        // - _next/static (static files)
        // - _next/image (image optimization files)
        // - favicon.ico (favicon file)
        // '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
