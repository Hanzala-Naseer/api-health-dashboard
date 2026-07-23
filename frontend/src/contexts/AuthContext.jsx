import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  loginUser,
  logoutUser,
  getCurrentUser,
  registerUser,
  verifyOtp as verifyOtpApi,
  resendOtp as resendOtpApi,
} from '../api/authApi';
import { setAccessToken, clearAccessToken, getAccessToken } from '../api/client';
import { AuthContext } from './authContextInstance';

const USER_STORAGE_KEY = 'apihealth_user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUser(user) {
  if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, if we have an access token, validate it against /auth/me.
  // NOTE: /auth/me only returns { id, email, role, status } — no name — so
  // we merge it into whatever richer profile we already have in storage
  // (set at login/register time) rather than overwriting firstName/lastName.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const freshUser = await getCurrentUser();
        if (cancelled) return;
        setUser((prev) => {
          const merged = { ...prev, ...freshUser };
          persistUser(merged);
          return merged;
        });
      } catch {
        if (cancelled) return;
        clearAccessToken();
        persistUser(null);
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Forced logout from the axios interceptor (refresh token expired/revoked).
  useEffect(() => {
    function handleForcedLogout() {
      clearAccessToken();
      persistUser(null);
      setUser(null);
    }
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const login = useCallback(async ({ email, password, rememberMe }) => {
    const result = await loginUser({ email, password, rememberMe });
    setAccessToken(result.accessToken);
    persistUser(result.user);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await registerUser(payload);
    // Backend deliberately does NOT log the user in at this point — they
    // must verify their email via OTP first.
    return result.user;
  }, []);

  const verifyOtp = useCallback(async ({ email, otp, purpose }) => {
    return verifyOtpApi({ email, otp, purpose });
  }, []);

  const resendOtp = useCallback(async ({ email, purpose }) => {
    return resendOtpApi({ email, purpose });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Even if the network call fails, clear the local session.
    } finally {
      clearAccessToken();
      persistUser(null);
      setUser(null);
    }
  }, []);

  const updateStoredUser = useCallback((patch) => {
    setUser((prev) => {
      const merged = { ...prev, ...patch };
      persistUser(merged);
      return merged;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      verifyOtp,
      resendOtp,
      logout,
      updateStoredUser,
    }),
    [user, isLoading, login, register, verifyOtp, resendOtp, logout, updateStoredUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
