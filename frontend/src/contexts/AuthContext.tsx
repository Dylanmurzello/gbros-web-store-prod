'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  authenticate as apiAuthenticate,
  logout as apiLogout,
  getActiveCustomer,
  isErrorResult,
} from '@/lib/vendure/api';
import { Customer, CurrentUser, AuthenticationInput, ErrorResult } from '@/lib/vendure/types';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger'; // PERFORMANCE FIX: 2025-09-30 - No more console spam in production 🤫

interface AuthContextType {
  customer: Customer | null;
  currentUser: CurrentUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  authenticateWithGoogle: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Fetch active customer on mount
  // BUG FIX: 2025-09-30 - Added proper dependencies to prevent stale closures (even tho setState is stable, better safe than sorry fr)
  const refreshCustomer = useCallback(async () => {
    try {
      setLoading(true);
      logger.debug('Starting customer refresh...', 'AuthContext');
      const activeCustomer = await getActiveCustomer();
      logger.debug('Active customer fetched:', 'AuthContext', activeCustomer);
      if (activeCustomer) {
        setCustomer(activeCustomer);
        logger.info(`Customer state updated: ${activeCustomer.emailAddress}`, 'AuthContext');
      } else {
        setCustomer(null);
        logger.debug('No active customer found', 'AuthContext');
      }
      setError(null);
    } catch (err) {
      logger.error('Error fetching customer', 'AuthContext', err);
      setCustomer(null);
      // Don't set error for initial load if user is not authenticated
    } finally {
      setLoading(false);
    }
    // setState functions are stable but explicitly listing them follows best practices and prevents future footguns
  }, [setLoading, setCustomer, setError]);

  // Only run API calls after hydration to prevent SSR/client mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      refreshCustomer();
    }
  }, [mounted, refreshCustomer]);

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const result = await apiLogin(email, password, rememberMe);

      if (isErrorResult(result)) {
        const errorResult = result as ErrorResult;
        if (errorResult.errorCode === 'INVALID_CREDENTIALS_ERROR') {
          setError('Invalid email or password');
        } else if (errorResult.errorCode === 'NOT_VERIFIED_ERROR') {
          setError('Please verify your email address before logging in');
        } else {
          setError(errorResult.message || 'Login failed');
        }
        return false;
      }

      const user = result as CurrentUser;
      logger.info('Login successful', 'AuthContext', { identifier: user.identifier });
      setCurrentUser(user);

      // Small delay to ensure token is properly saved
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch customer data after successful login
      logger.debug('Fetching customer data after login...', 'AuthContext');
      await refreshCustomer();
      logger.debug('Customer data fetched after login', 'AuthContext');

      return true;
    } catch (err) {
      logger.error('Error during login', 'AuthContext', err);
      setError('An unexpected error occurred during login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const authenticateWithGoogle = async (token: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const input: AuthenticationInput = {
        google: { token }
      };

      const result = await apiAuthenticate(input);

      if (isErrorResult(result)) {
        const errorResult = result as ErrorResult;
        setError(errorResult.message || 'Google authentication failed');
        return false;
      }

      setCurrentUser(result as CurrentUser);

      // Fetch customer data after successful authentication
      await refreshCustomer();

      return true;
    } catch (err) {
      logger.error('Error during Google authentication', 'AuthContext', err);
      setError('An unexpected error occurred during Google authentication');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiLogout();
      setCustomer(null);
      setCurrentUser(null);
      setError(null);

      // Refresh the page to clear any cached data
      router.push('/');
      router.refresh();
    } catch (err) {
      logger.error('Error during logout', 'AuthContext', err);
      setError('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        currentUser,
        loading,
        error,
        login,
        authenticateWithGoogle,
        logout,
        refreshCustomer,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}