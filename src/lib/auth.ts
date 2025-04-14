import { createContext, useContext } from 'react';
import { User } from '../types/users';

export const AuthContext = createContext<{
  user: User | null;
  isLoading: boolean;
}>({
  user: null,
  isLoading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};