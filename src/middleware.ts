import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // For this simple case, we redirect to login if they are not at the login page.
    // A real app would check for an auth token.
    // We are allowing access to the root page to redirect to login or app.
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static')) {
        return NextResponse.next();
    }
    
    // This app doesn't have a real authentication system.
    // We will redirect to /records as the main page.
    // The login page is effectively removed in favor of anonymous auth.
    if (pathname === '/login') {
        return NextResponse.next();
    }

    if (pathname !== '/' && !pathname.startsWith('/records') && !pathname.startsWith('/dashboard') && !pathname.startsWith('/customers') && !pathname.startsWith('/invoices')) {
       // If trying to access something else, maybe go to login?
       // For now, let's allow it but a real app would lock this down.
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
