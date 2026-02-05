import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
    // 1. Update Supabase session and handle auth redirects
    const response = await updateSession(request);

    // If the auth middleware returned a redirect (e.g. to /login), return it immediately
    if (response.headers.get('x-middleware-rewrite') || response.headers.get('location')) {
        return response;
    }

    // 2. Run next-intl middleware for localized routing
    return intlMiddleware(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Public assets like svg, png, etc.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
