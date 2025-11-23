import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-me');

export async function middleware(request: NextRequest) {
    const authToken = request.cookies.get('auth_token')?.value;
    const { pathname } = request.nextUrl;

    // Public routes
    if (pathname === '/login' || pathname.startsWith('/api/auth')) {
        if (authToken && pathname === '/login') {
            try {
                await jwtVerify(authToken, JWT_SECRET);
                return NextResponse.redirect(new URL('/', request.url));
            } catch (e) {
                // Invalid token, allow login
            }
        }
        return NextResponse.next();
    }

    // Protected routes
    if (!authToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const { payload } = await jwtVerify(authToken, JWT_SECRET);

        // Admin routes protection
        if (pathname.startsWith('/admin') && payload.type !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
    } catch (error) {
        // Invalid token
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth_token');
        return response;
    }
}

export const config = {
    matcher: [
        '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)',
    ],
};
