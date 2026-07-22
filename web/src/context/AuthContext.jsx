import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContextValue";
import { getStoredSession, loginRequest, logoutRequest, refreshCurrentUser } from "../services/authService";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const stored = getStoredSession();

    if (!stored.token) {
      setSession({ token: null, user: null });
      setLoading(false);
      return;
    }

    try {
      const user = await refreshCurrentUser();
      setSession({ token: stored.token, user });
    } catch {
      logoutRequest();
      setSession({ token: null, user: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      loading,
      token: session.token,
      user: session.user,
      isAuthenticated: Boolean(session.token && session.user),
      login: async (credentials) => {
        const nextSession = await loginRequest(credentials);
        setSession(nextSession);
        return nextSession;
      },
      logout: () => {
        logoutRequest();
        setSession({ token: null, user: null });
      },
      refreshSession,
    }),
    [loading, refreshSession, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
