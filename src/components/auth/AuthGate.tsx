import { ReactNode, useEffect, useRef, useState } from 'react';
import { useAuth, AuthUser } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const authMode = import.meta.env.VITE_API_AUTH_MODE as string | undefined;
const developmentUserId = import.meta.env.VITE_ELC_DEV_USER_ID as string | undefined;

export function AuthGate({ children }: { children: ReactNode }) {
  const { apiBaseUrl, token, user, setSession } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signInDevelopment = async () => {
    if (!developmentUserId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/me`, { headers: { 'x-dev-user-id': developmentUserId } });
      if (!response.ok) throw new Error('Local API identity was rejected. Check API development auth configuration.');
      setSession(developmentUserId, await response.json() as AuthUser, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token || !googleClientId || authMode === 'development') return;
    const initialize = () => {
      if (!buttonRef.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        auto_select: false,
        callback: async ({ credential }) => {
          setLoading(true);
          setError('');
          try {
            const response = await fetch(`${apiBaseUrl}/auth/me`, { headers: { Authorization: `Bearer ${credential}` } });
            if (!response.ok) throw new Error(response.status === 401 ? 'Your Google account is not enabled for this CRM.' : 'Sign-in could not be verified. Try again.');
            const profile = await response.json() as AuthUser;
            setSession(credential, profile);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Sign-in failed. Try again.');
          } finally {
            setLoading(false);
          }
        },
      });
      buttonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(buttonRef.current, { theme: 'filled_black', size: 'large', text: 'signin_with', shape: 'rectangular', width: 280 });
    };

    const currentScript = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (window.google) initialize();
    else if (currentScript) currentScript.addEventListener('load', initialize, { once: true });
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.addEventListener('load', initialize, { once: true });
      script.addEventListener('error', () => setError('Google sign-in could not load.'), { once: true });
      document.head.append(script);
    }
  }, [apiBaseUrl, token, setSession]);

  if (token && user) {
    return <>{children}</>;
  }

  return <main className="min-h-screen grid place-items-center bg-background p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center gap-4">
        <Logo />
        <div><CardTitle>Sign in to Executive Lead Control</CardTitle><CardDescription className="mt-2">Use your authorized Google Workspace account.</CardDescription></div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {authMode === 'development' && developmentUserId
          ? <Button onClick={signInDevelopment} disabled={loading}>Sign in to local API</Button>
          : googleClientId ? <div ref={buttonRef} className="min-h-10" /> : <p className="text-sm text-destructive">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>}
        {loading && <p className="text-sm text-muted-foreground">Verifying account…</p>}
        {error && <p role="alert" className="text-sm text-destructive text-center">{error}</p>}
      </CardContent>
    </Card>
  </main>;
}
