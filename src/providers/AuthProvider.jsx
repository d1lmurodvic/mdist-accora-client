import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, onUnauthorized } from '../lib/api/client.js';
import { tokenStore } from '../lib/storage.js';

/**
 * Session state, derived from GET /auth/me (API_CONTRACT.md §9.1):
 *   'loading'     — checking the stored session
 *   'anonymous'   — no valid session
 *   'onboarding'  — signed in; company not created or onboarding not completed
 *   'ready'       — signed in with an onboarded company
 * A 401 anywhere ends the session locally.
 */
const AuthContext = createContext(null);
export const ME_QUERY_KEY = ['auth', 'me'];

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const hasToken = Boolean(tokenStore.get());

  const me = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async ({ signal }) => (await api.get('/auth/me', { signal })).data,
    enabled: hasToken,
    staleTime: 60_000,
    retry: false,
  });

  const endSession = useCallback(() => {
    tokenStore.clear();
    // Mark the session as ended first (observers re-render as anonymous), then
    // drop every other cached response so nothing of this session remains.
    // queryClient.clear() would also detach the session query's observer.
    queryClient.setQueryData(ME_QUERY_KEY, null);
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== ME_QUERY_KEY[0] });
  }, [queryClient]);

  useEffect(() => onUnauthorized(endSession), [endSession]);

  /** Start a session with the token returned by register or login. */
  const signIn = useCallback(async (token) => {
    tokenStore.set(token);
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    await queryClient.fetchQuery({ queryKey: ME_QUERY_KEY, queryFn: async () => (await api.get('/auth/me')).data });
  }, [queryClient]);

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // The local session ends regardless.
    }
    endSession();
  }, [endSession]);

  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }), [queryClient]);

  const value = useMemo(() => {
    let status;
    if (!tokenStore.get() || me.data === null) status = 'anonymous';
    else if (me.isPending) status = 'loading';
    else if (me.isError) status = me.error?.status === 401 ? 'anonymous' : 'error';
    else status = me.data.onboarding?.completed ? 'ready' : 'onboarding';
    return {
      status,
      user: me.data?.user ?? null,
      memberships: me.data?.memberships ?? [],
      onboarding: me.data?.onboarding ?? null,
      company: me.data?.memberships?.[0]?.company ?? null,
      role: me.data?.memberships?.[0]?.role ?? null,
      error: me.error ?? null,
      signIn,
      signOut,
      refresh,
    };
  }, [me.data, me.isPending, me.isError, me.error, signIn, signOut, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
