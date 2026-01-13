
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isLoggedIn = request.cookies.get('firebase-auth-key'); // A simple check for a cookie
    
    // Allow API routes and static files to pass through
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static')) {
        return NextResponse.next();
    }
    
    // If user is on the login page
    if (pathname === '/login') {
        // If they are already logged in, redirect them to the records page
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/records', request.url));
        }
        // Otherwise, let them see the login page
        return NextResponse.next();
    }

    // For any other page, if the user is not logged in, redirect to login
    if (!isLoggedIn && pathname !== '/') {
         return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // If user is at root, and logged in, go to records. If not, go to login.
    if (pathname === '/') {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/records', request.url));
        } else {
            return NextResponse.redirect(new URL('/login', request.url));
        }
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
