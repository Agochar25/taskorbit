import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, configureApi, getRefreshToken, setTokens } from '../api/client';
import { clearSession, loadSession, saveSession } from '../storage/secure';
import { cacheClear } from '../storage/cache';
import { cancelReminders, refreshReminders } from '../notifications';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [notice, setNotice] = useState('');

  const startSession = useCallback(async (r) => {
    setTokens(r);
    await saveSession({ accessToken: r.accessToken, refreshToken: r.refreshToken, user: r.user });
    setUser(r.user);
    setNotice('');
    refreshReminders();
  }, []);

  useEffect(() => {
    configureApi({
      persist: (r) => saveSession({ accessToken: r.accessToken, refreshToken: r.refreshToken, user: r.user }),
      onExpired: async (message) => {
        setTokens(null);
        await clearSession();
        setUser(null);
        setNotice(message);
      },
    });
    (async () => {
      const saved = await loadSession();
      if (saved) {
        setTokens(saved);
        try {
          const me = await api('/auth/me');
          setUser(me.user);
          refreshReminders();
        } catch (e) {
          if (e.code === 'NETWORK' && saved.user) setUser(saved.user); // offline start: open with cached data
          else if (e.code !== 'SESSION_EXPIRED') { setTokens(null); await clearSession(); }
        }
      }
      setBooting(false);
    })();
  }, []);

  const login = useCallback(async (email, password) => startSession(await api('/auth/login', { method: 'POST', body: { email, password }, auth: false })), [startSession]);
  const register = useCallback(async (fullName, email, password) => startSession(await api('/auth/register', { method: 'POST', body: { fullName, email, password }, auth: false })), [startSession]);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    api('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }).catch(() => {});
    setTokens(null);
    await Promise.all([clearSession(), cacheClear(), cancelReminders()]);
    setUser(null);
    setNotice('');
  }, []);

  const value = useMemo(() => ({ user, booting, notice, setNotice, login, register, logout }), [user, booting, notice, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
