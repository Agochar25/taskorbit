import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearSession, configureApi, getRefreshToken, hasStoredSession, refreshSession, setSession } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    configureApi({
      onExpired: () => {
        clearSession();
        setUser(null);
        setNotice('Your session has expired. Please log in again.');
      },
    });
    (async () => {
      try {
        if (hasStoredSession()) {
          const r = await refreshSession();
          if (r) setUser(r.user);
          else setNotice('Your session has expired. Please log in again.');
        }
      } catch {
        /* offline at startup: stay signed out, user can retry */
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    setSession(r); setUser(r.user); setNotice('');
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    const r = await api('/auth/register', { method: 'POST', body: { fullName, email, password }, auth: false });
    setSession(r); setUser(r.user); setNotice('');
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    clearSession(); setUser(null); setNotice('');
    try { await api('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }); } catch { /* already signed out locally */ }
  }, []);

  const value = useMemo(() => ({ user, booting, notice, setNotice, login, register, logout }), [user, booting, notice, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
