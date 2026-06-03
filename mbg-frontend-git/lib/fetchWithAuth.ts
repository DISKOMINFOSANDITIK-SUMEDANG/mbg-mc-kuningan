import { clearAuthData } from '@/lib/auth/cookies';

let isRedirecting = false;

function redirectToLogin() {
  if (isRedirecting) return;
  isRedirecting = true;

  if (typeof window !== 'undefined') {
    localStorage.clear();
    clearAuthData();
    window.location.href = '/cms/auth/login';
  }
}

/**
 * Fetch wrapper that automatically includes credentials and handles
 * session expiry (401) and rate-limiting (429) by redirecting to login.
 *
 * Drop-in replacement for `fetch` in CMS pages.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
  });

  if (response.status === 401 || response.status === 429) {
    redirectToLogin();
  }

  return response;
}
