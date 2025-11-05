import { useContext } from 'react';
import { AuthContext } from '../lib/authContext';
import type { AuthState, LoginCredentials, User } from '../types/auth.types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};