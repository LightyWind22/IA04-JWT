import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import type { User } from '../types/auth.types';

interface MeResponse {
  user: User;
  accessToken?: string;
}

export function useUserQuery() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const resp = await axiosInstance.get<MeResponse>('/auth/me');
      return resp.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}


