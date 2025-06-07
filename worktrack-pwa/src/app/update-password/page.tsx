// src/app/update-password/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorCode = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (errorCode) {
      setError(errorDescription || 'An error occurred. The password reset link may be invalid or expired.');
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // This event fires when the user has successfully initiated password recovery,
        // typically after they've clicked the link in the email and Supabase has verified the token.
        // At this point, they are effectively in a state where they can set a new password.
        // Some flows might auto-sign-in the user here, others require them to set password first.
        // The form below is for setting the new password.
        setMessage('You can now set your new password.');
      } else if (event === "USER_UPDATED") {
        // This event fires after supabase.auth.updateUser() is successful.
        setMessage('Password updated successfully! Redirecting to login...');
        setTimeout(() => router.push('/login'), 3000);
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router, searchParams]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    // The user should have arrived here via a link that includes a recovery token in the URL fragment (#).
    // Supabase client library automatically detects this token from the URL when it initializes.
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      // USER_UPDATED event in onAuthStateChange will handle success message and redirect.
      // setMessage('Password update request sent successfully. Please wait...');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Update Your Password
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 sr-only">New Password</label>
            <input
              id="new-password"
              name="newPassword"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {message && <p className="text-green-600 text-center">{message}</p>}
          {error && <p className="text-red-600 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
