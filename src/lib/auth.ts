import { createContext, useContext, useEffect } from 'react';
import { User } from '../types/users';
import { supabase } from './supabase';

// 30 minutes in milliseconds
const SESSION_TIMEOUT = 30 * 60 * 1000;

export const AuthContext = createContext<{
  user: User | null;
  isLoading: boolean;
  lastActivity: number;
  checkSession: () => Promise<boolean>;
}>({
  user: null,
  isLoading: true,
  lastActivity: Date.now(),
  checkSession: async () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const checkTokenValidity = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    // Check if token is expired
    const tokenExpiry = new Date(session.expires_at! * 1000);
    if (tokenExpiry < new Date()) {
      await supabase.auth.signOut();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

export const isSessionExpired = (lastActivity: number) => {
  return Date.now() - lastActivity > SESSION_TIMEOUT;
};

// Rate limiting for login attempts
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry) {
    rateLimitMap.set(identifier, { attempts: 1, firstAttempt: now });
    return true;
  }

  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(identifier, { attempts: 1, firstAttempt: now });
    return true;
  }

  if (entry.attempts >= RATE_LIMIT_ATTEMPTS) {
    return false;
  }

  entry.attempts += 1;
  return true;
};

export const clearRateLimit = (identifier: string) => {
  rateLimitMap.delete(identifier);
};