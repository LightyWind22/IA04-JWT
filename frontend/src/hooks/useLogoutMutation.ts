import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useLogoutMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => auth.logout(),
    onSettled: () => {
      // Ensure all user-related caches are cleared
      queryClient.removeQueries({ queryKey: ['me'], exact: false });
    },
    retry: 0,
  });
}


