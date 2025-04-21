import React, { useContext } from 'react';
import { User } from '../types/users';

// Create and export the AuthContext
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  lastActivity: number;
  checkSession: () => Promise<boolean>;
}

export const AuthContext = React.createContext<AuthContextType | null>(null);

// Create and export the useAuth hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}