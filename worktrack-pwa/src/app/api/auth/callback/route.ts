// src/app/api/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';


export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = cookies();
    // Note: The plan used createSupabaseServerClient(cookieStore)
    // but createServerClient from '@supabase/ssr' takes 3 args or an options object.
    // Let's use the standard 3-arg or options object way.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if there's a next path in the query params or redirect to dashboard
      const next = requestUrl.searchParams.get('next') || '/(app)/dashboard';
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('Error exchanging code for session:', error.message);
  } else {
    console.error('No code found in auth callback query params');
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&message=Could not log you in. Please try again.`);
}
