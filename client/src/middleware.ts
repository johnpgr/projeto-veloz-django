import { NextResponse, NextRequest } from 'next/server'

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000'

async function fetchServerAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${INTERNAL_API_URL}${endpoint}`
    const defaultOptions: RequestInit = {
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
        },
    }
    const response = await fetch(url, { ...defaultOptions, ...options })

    if (!response.ok) {
        let errorData
        try {
            errorData = await response.json()
        } catch (e) {
            errorData = { detail: response.statusText }
        }
        console.error('Middleware API Error:', errorData)
        throw new Error(errorData.detail || 'An API error occurred in middleware')
    }
    if (response.status === 204) { // No Content
        return undefined as T
    }
    return response.json()
}

// Helper to check if token is expired (basic check)
function isTokenExpired(token: string): boolean {
    try {
        const payloadBase64 = token.split('.')[1]
        if (!payloadBase64) return true
        const decodedJson = Buffer.from(payloadBase64, 'base64').toString()
        const decoded = JSON.parse(decodedJson)
        const exp = decoded.exp
        return (Date.now() / 1000) > exp
    } catch (e) {
        return true
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const accessToken = request.cookies.get('access_token')?.value
    const refreshToken = request.cookies.get('refresh_token')?.value

    const isAuthPage = pathname.startsWith('/auth')
    const isApiAuthRoute = pathname.startsWith('/api/auth') // Exclude internal API calls if proxied via Next.js /api routes

    if (isApiAuthRoute) {
        return NextResponse.next()
    }

    if (!accessToken && refreshToken) {
        // Access token missing or expired, try to refresh
        try {
            console.log('Middleware: Attempting token refresh...')
            const refreshResponse = await fetchServerAPI<{ access: string }>('/auth/refresh/', {
                method: 'POST',
                body: JSON.stringify({ refresh: refreshToken }),
            })

            if (refreshResponse.access) {
                console.log('Middleware: Token refreshed successfully.')
                let responseToReturn: NextResponse

                const cookieOptions = {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    path: '/',
                    sameSite: 'lax' as 'lax', // Ensure correct literal type for sameSite
                    maxAge: 60 * 60, // 1 hour
                }

                // If on /auth/login or /auth/register and refresh is successful, redirect to home.
                // Otherwise (e.g. on /auth/profile or other pages), continue to the requested page.
                if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) {
                    responseToReturn = NextResponse.redirect(new URL('/', request.url));
                } else {
                    responseToReturn = NextResponse.next();
                }
                responseToReturn.cookies.set('access_token', refreshResponse.access, cookieOptions);
                return responseToReturn
            } else {
                throw new Error('Refresh token endpoint did not return new access token.')
            }
        } catch (error) {
            console.error('Middleware: Refresh token failed:', error)
            // Clear invalid refresh token and redirect to login
            const response = NextResponse.redirect(new URL('/auth/login', request.url))
            response.cookies.delete('access_token')
            response.cookies.delete('refresh_token')
            return response
        }
    }

    // If user is authenticated and tries to access /auth/login, or /auth/register, redirect to home
    const authRedirectPaths = ['/auth/login', '/auth/register']
    if (
        accessToken &&
        !isTokenExpired(accessToken) &&
        authRedirectPaths.some(p => pathname === p || pathname === p + '/')
    ) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // If user is not authenticated and tries to access a protected route, redirect to /auth/login
    // Define your protected routes here. For example, all routes except /auth and static assets.
    const protectedPaths = ['/profile', '/dashboard', '/auth/profile'] // Add your protected paths
    const isProtectedRoute = protectedPaths.some(p => pathname.startsWith(p))

    if (!accessToken && isProtectedRoute) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // If access token is present but expired, and no refresh token, redirect to login
    if (accessToken && isTokenExpired(accessToken) && !refreshToken && !isAuthPage) {
        console.log('Middleware: Access token expired, no refresh token. Redirecting to login.')
        const response = NextResponse.redirect(new URL('/auth/login', request.url))
        response.cookies.delete('access_token') // Clear the expired token
        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - files in public folder (e.g. /file.svg, /globe.svg)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)',
    ],
}
