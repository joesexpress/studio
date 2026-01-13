
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuth, Auth } from 'firebase/auth';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isLoginPage = pathname.startsWith('/login');
    const hasUserToken = request.cookies.has('userToken'); // A simple check, a more robust solution would verify the token
    
    // Allow API routes and static files to pass through
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static')) {
        return NextResponse.next();
    }
    
    if (isLoginPage) {
        // If user is logged in and tries to access login page, redirect to records
        if (hasUserToken) {
            return NextResponse.redirect(new URL('/records', request.url));
        }
        // Allow unauthenticated user to access login page
        return NextResponse.next();
    }

    if (!hasUserToken) {
         // If user is not logged in and not on the login page, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // If user is at root, go to records.
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/records', request.url));
    }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
