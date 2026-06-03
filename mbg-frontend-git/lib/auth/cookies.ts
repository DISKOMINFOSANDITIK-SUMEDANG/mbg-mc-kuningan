// Cookie utility functions for authentication

export const setAuthCookie = (token: string, maxAge: number = 7 * 24 * 60 * 60) => {
  // Set cookie for middleware (server-side)
  if (typeof document !== 'undefined') {
    // For development, remove secure flag
    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction ? '; secure' : '';
    
    document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}${secureFlag}; samesite=strict`;
    console.log('Cookie set:', `auth_token=${token}; path=/; max-age=${maxAge}${secureFlag}; samesite=strict`);
  }
};

export const getAuthCookie = (): string | null => {
  // Get cookie from browser
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
    return authCookie ? authCookie.split('=')[1] : null;
  }
  return null;
};

export const removeAuthCookie = () => {
  // Remove cookie
  if (typeof document !== 'undefined') {
    document.cookie = 'auth_token=; path=/; max-age=0; secure; samesite=strict';
  }
};

const USER_CACHE_FIELDS = [
  'id',
  'userId',
  'email',
  'role',
  'full_name',
  'fullName',
  'phone',
  'avatar_url',
  'avatarUrl',
  'school_id',
  'school_name',
  'school_level',
  'school_district',
  'position',
  'sppg_id',
  'sppg_name',
  'sppg_type',
  'sppg_location',
  'supplier_id',
  'supplier_name',
  'offtaker_id',
  'offtaker_name',
  'is_active',
  'last_login',
] as const;

const buildCompactUserData = (userData: Record<string, unknown>) => {
  const compactData: Record<string, unknown> = {};
  USER_CACHE_FIELDS.forEach((key) => {
    if (userData[key] !== undefined) {
      compactData[key] = userData[key];
    }
  });
  return compactData;
};

export const setUserData = (userData: Record<string, unknown>) => {
  // Store user data in localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('user_data', JSON.stringify(userData));
      return true;
    } catch (error) {
      const isQuotaExceeded =
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014);

      if (!isQuotaExceeded) {
        console.warn('[AuthStorage] Failed to cache user_data:', error);
        return false;
      }

      // Fallback: save a compact user shape if storage is close to full.
      try {
        const compactUserData = buildCompactUserData(userData);
        localStorage.removeItem('user_data');
        localStorage.setItem('user_data', JSON.stringify(compactUserData));
        console.warn('[AuthStorage] Cached compact user_data because storage quota is full');
        return true;
      } catch (retryError) {
        console.warn('[AuthStorage] Unable to cache user_data after quota fallback:', retryError);
        return false;
      }
    }
  }
  return false;
};

export const getUserData = (): Record<string, unknown> | null => {
  // Get user data from localStorage
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
  return null;
};

export const clearAuthData = () => {
  // Clear all auth data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }
  removeAuthCookie();
};
