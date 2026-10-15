import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, setPassphrase } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('mw_token')) return setLoading(false);
    api('/user/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (mode, payload) => {
    const d = await api('/auth/' + mode, { method: 'POST', body: payload });
    setToken(d.token);
    setUser(d.user);
    if (payload.passphrase) {
      setPassphrase(payload.passphrase);
      setUnlocked(true);
    }
  };

  // Verifies the passphrase against the server before unlocking
  const unlock = async (p) => {
    setPassphrase(p);
    try {
      await api('/journal');
      setUnlocked(true);
    } catch (e) {
      setPassphrase(null);
      throw e;
    }
  };

  const lock = () => {
    setPassphrase(null);
    setUnlocked(false);
  };

  const logout = () => {
    lock();
    setToken(null);
    setUser(null);
  };

  const setPlan = async (premium) => {
    const d = await api('/user/plan', { method: 'PATCH', body: { premium } });
    setUser(d.user);
  };

  return (
    <Ctx.Provider value={{ user, loading, unlocked, authenticate, unlock, lock, logout, setPlan }}>
      {children}
    </Ctx.Provider>
  );
}
