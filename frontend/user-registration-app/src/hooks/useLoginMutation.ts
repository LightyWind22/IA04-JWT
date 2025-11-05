import { useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { LoginCredentials } from '../types/auth.types';

export const useLoginMutation = () => {
  const auth = useAuth();

  return useMutation<void, any, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      // Delegate the login logic to auth context (which calls axiosInstance)
      await auth.login(credentials);
    },
  });
};