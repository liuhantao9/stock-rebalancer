import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { User, AuthState, LoginCredentials, SignUpCredentials } from '../types';

interface UseAuthReturn extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email'>>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const currentUser = authService.getCurrentUser();
        setAuthState({
          user: currentUser,
          isAuthenticated: currentUser !== null,
          isLoading: false,
          error: null
        });
      } catch (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize authentication'
        });
      }
    };

    initializeAuth();
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authService.signIn(credentials);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      }));
      throw error;
    }
  }, []);

  const signUp = useCallback(async (credentials: SignUpCredentials): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authService.signUp(credentials);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authService.signOut();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      }));
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<User, 'name' | 'email'>>): Promise<void> => {
    if (!authState.user) {
      throw new Error('Not authenticated');
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const updatedUser = await authService.updateProfile(updates);
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Profile update failed'
      }));
      throw error;
    }
  }, [authState.user]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!authState.user) {
      throw new Error('Not authenticated');
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authService.changePassword(currentPassword, newPassword);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Password change failed'
      }));
      throw error;
    }
  }, [authState.user]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
    clearError
  };
};