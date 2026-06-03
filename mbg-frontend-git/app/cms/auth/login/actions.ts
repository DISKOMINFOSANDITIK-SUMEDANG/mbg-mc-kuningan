'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    // Call login API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const result = await response.json();

    if (result.token) {
      // Set cookie server-side
      const cookieStore = await cookies();
      cookieStore.set('auth_token', result.token, {
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Redirect based on role
      switch (result.user.role) {
        case 'administrator':
          redirect('/cms/dashboard');
        case 'sekolah':
          redirect('/cms/schools');
        case 'sppg':
          redirect('/cms/sppgs');
        default:
          redirect('/cms/dashboard');
      }
    }
  } catch (error) {
    console.error('Login action error:', error);
    throw new Error('Login failed');
  }
}
