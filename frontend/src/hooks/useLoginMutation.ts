import { useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { LoginCredentials } from '../types/auth.types';
import { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
  statusCode: number;
}

export const useLoginMutation = () => {
  const auth = useAuth();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => {
      return auth.login(credentials).catch((error) => {
        console.error('Login mutation caught error:', error);
        // Convert AxiosError to a regular Error with the server message
        if (error.response) {
          const serverError = new Error(
            error.response.data?.message || 'Login failed'
          );
          // Add extra properties that might be useful
          Object.assign(serverError, {
            status: error.response.status,
            serverData: error.response.data
          });
          throw serverError;
        }
        throw error;
      });
    },
    retry: 0
  });
};