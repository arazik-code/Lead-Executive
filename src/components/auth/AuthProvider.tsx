import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export interface AuthUser { id: string; email: string; role: 'admin' | 'manager' | 'agent'; }
interface AuthContextValue {
  apiBaseUrl: string;
  token: string | null;
  user: AuthUser | null;
  developmentIdentity: boolean;
  setSession: (token: string, user: AuthUser, developmentIdentity?: boolean) => void;
  authHeaders: () => Record<string, string>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, apiBaseUrl }: { children: ReactNode; apiBaseUrl: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [developmentIdentity, setDevelopmentIdentity] = useState(false);
  const value = useMemo<AuthContextValue>(() => ({
    apiBaseUrl,
    token,
    user,
    developmentIdentity,
    setSession: (newToken, newUser, isDevelopmentIdentity = false) => { setToken(newToken); setUser(newUser); setDevelopmentIdentity(isDevelopmentIdentity); },
    authHeaders: () => token ? developmentIdentity ? { 'x-dev-user-id': token } : { Authorization: `Bearer ${token}` } : {},
    signOut: () => { setToken(null); setUser(null); setDevelopmentIdentity(false); window.google?.accounts.id.disableAutoSelect(); },
  }), [apiBaseUrl, token, user, developmentIdentity]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
