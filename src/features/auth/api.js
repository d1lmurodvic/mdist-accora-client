import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api/client.js';
import { useAuth } from '../../providers/AuthProvider.jsx';

/*
 * Authentication and onboarding calls (API_CONTRACT.md §9.1, §9.3).
 * On success the returned session token starts the session; the auth
 * provider then re-reads GET /auth/me, and the route guards move the user on.
 */

export function useLogin() {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: async ({ email, password }) => (await api.post('/auth/login', { email, password }, { auth: false })).data,
    onSuccess: (data) => signIn(data.session.token),
  });
}

export function useRegister() {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: async ({ name, email, password }) => (await api.post('/auth/register', { name, email, password }, { auth: false })).data,
    onSuccess: (data) => signIn(data.session.token),
  });
}

export function useCreateCompany() {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: async (body) => (await api.post('/companies', body)).data,
    onSuccess: () => refresh(),
  });
}

/** Optionally load the demo dataset, then mark onboarding complete. */
export function useFinishOnboarding() {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: async ({ loadDemo }) => {
      if (loadDemo) await api.post('/companies/current/demo-data', {});
      return (await api.post('/companies/current/complete-onboarding', {})).data;
    },
    onSuccess: () => refresh(),
  });
}
