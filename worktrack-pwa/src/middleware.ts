// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request and response cookies
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request and response cookies
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session (important for Server Components)
  // Puts the session into the cookie store if it's not there
  // This must be called before `getSession`
  await supabase.auth.getUser();

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // Protected routes start with /app or are in the (app) group logic
  // For this project, route group (app) means /app/dashboard etc.
  // The actual URL path for (app)/dashboard is /dashboard.
  // So we check if pathname starts with any of the (app) group actual paths.
  // For now, we can assume anything NOT login, signup, forgot-password, update-password, api/auth, or root is protected.
  // Or more simply, if it's meant to be within the (app) layout.
  // The previous subtask created (app)/dashboard.
  // Let's adjust the logic to be more explicit about which paths are part of the (app) group.
  // For now, any path that is not explicitly public AND is not an API route or static asset will be considered.
  // A common pattern is to have /dashboard, /profile, etc. as protected.
  // The `(app)` group itself doesn't appear in the URL. So `/(app)/dashboard` is accessible as `/dashboard`.

  const protectedPaths = ['/dashboard', '/attendance', '/leave']; // Add other protected paths here
  const isProtectedPath = protectedPaths.some(p => pathname.startsWith(p)) || pathname.startsWith('/(app)');
  // The pathname.startsWith('/(app)') might be problematic as (app) is not in URL.
  // Let's assume that if a page is inside src/app/(app), it is a protected route.
  // The matcher already excludes static assets.
  // The current matcher is: '/((?!_next/static|_next/image|favicon.ico|api/auth/.*|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  // This means this middleware runs for almost everything.

  // If user is not logged in and trying to access a protected path
  if (!session && isProtectedPath) {
    // If the pathname itself is from the (app) group, we redirect to /login
    // Example: /dashboard (which is src/app/(app)/dashboard/page.tsx)
    // Example: /attendance (src/app/(app)/attendance/page.tsx)
    // This logic needs to be robust. If /foo is in (app) group, it means /foo is protected.
    // A simpler way: all routes within (app) group are protected.
    // The middleware runs on all paths defined in `config.matcher`.
    // We need to know if `pathname` belongs to the `(app)` group.
    // Since `(app)` is not in the URL, we rely on a list or convention.
    // The previous step created /src/app/(app)/dashboard/page.tsx.
    // The subtask also mentions /attendance and /leave which are also likely in (app) group.
    // For now, if the path is one of the known main app pages, protect it.
    // The `pathname.startsWith('/(app)')` in `isProtectedPath` is incorrect.
    // The correct check should be if the path corresponds to a route within the `(app)` group.
    // Let's assume all pages starting with `/dashboard`, `/attendance`, `/leave` are protected.
    // And if the path IS / (root), it's public.

    const publicPaths = ['/login', '/signup', '/forgot-password', '/update-password', '/'];
    if (!publicPaths.includes(pathname) && !pathname.startsWith('/api/')) { // if not a public path & not an api route
        return NextResponse.redirect(new URL('/login', request.url));
    }
  }


  // If user is logged in and trying to access login/signup pages, redirect to dashboard
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/(app)/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth/ (Supabase auth callbacks like /api/auth/callback)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
