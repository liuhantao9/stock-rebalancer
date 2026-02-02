import { AuthStorage, User, LoginCredentials, SignUpCredentials } from '../types';

const AUTH_STORAGE_KEY = 'stock-rebalancer-auth';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private getDefaultAuthStorage(): AuthStorage {
    return {
      users: {},
      currentUserId: undefined,
      sessions: {}
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  // Simple password hashing (in production, use bcrypt or similar)
  private hashPassword(password: string): string {
    // This is a simple hash for demo purposes - use proper hashing in production
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private loadAuthStorage(): AuthStorage {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        return this.getDefaultAuthStorage();
      }

      const parsed = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      Object.values(parsed.users || {}).forEach((user: any) => {
        user.createdAt = new Date(user.createdAt);
        user.lastLoginAt = new Date(user.lastLoginAt);
      });

      Object.values(parsed.sessions || {}).forEach((session: any) => {
        session.createdAt = new Date(session.createdAt);
        session.expiresAt = new Date(session.expiresAt);
      });

      return {
        ...this.getDefaultAuthStorage(),
        ...parsed
      };
    } catch (error) {
      console.error('Error loading auth storage:', error);
      return this.getDefaultAuthStorage();
    }
  }

  private saveAuthStorage(data: AuthStorage): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving auth storage:', error);
      throw new Error('Failed to save authentication data.');
    }
  }

  private cleanExpiredSessions(): void {
    const storage = this.loadAuthStorage();
    const now = new Date();
    
    Object.keys(storage.sessions).forEach(sessionId => {
      if (storage.sessions[sessionId].expiresAt < now) {
        delete storage.sessions[sessionId];
      }
    });

    this.saveAuthStorage(storage);
  }

  // Sign up new user
  async signUp(credentials: SignUpCredentials): Promise<User> {
    const { email, password, name, confirmPassword } = credentials;

    // Validation
    if (!email || !password || !name) {
      throw new Error('All fields are required');
    }

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    const storage = this.loadAuthStorage();

    // Check if user already exists
    const existingUser = Object.values(storage.users).find(user => user.email === email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const userId = this.generateId();
    const now = new Date();
    
    const newUser = {
      id: userId,
      email,
      name,
      passwordHash: this.hashPassword(password),
      createdAt: now,
      lastLoginAt: now
    };

    storage.users[userId] = newUser;
    storage.currentUserId = userId;

    // Create session
    const sessionToken = this.generateSessionToken();
    storage.sessions[sessionToken] = {
      userId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SESSION_DURATION)
    };

    this.saveAuthStorage(storage);

    // Store session token
    localStorage.setItem('sessionToken', sessionToken);

    return {
      id: userId,
      email,
      name,
      createdAt: now,
      lastLoginAt: now
    };
  }

  // Sign in existing user
  async signIn(credentials: LoginCredentials): Promise<User> {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const storage = this.loadAuthStorage();
    this.cleanExpiredSessions();

    // Find user by email
    const user = Object.values(storage.users).find(user => user.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const passwordHash = this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    const now = new Date();
    user.lastLoginAt = now;
    storage.users[user.id] = user;
    storage.currentUserId = user.id;

    // Create new session
    const sessionToken = this.generateSessionToken();
    storage.sessions[sessionToken] = {
      userId: user.id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SESSION_DURATION)
    };

    this.saveAuthStorage(storage);

    // Store session token
    localStorage.setItem('sessionToken', sessionToken);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lastLoginAt: now
    };
  }

  // Sign out current user
  async signOut(): Promise<void> {
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
      const storage = this.loadAuthStorage();
      delete storage.sessions[sessionToken];
      storage.currentUserId = undefined;
      this.saveAuthStorage(storage);
      localStorage.removeItem('sessionToken');
    }
  }

  // Get current authenticated user
  getCurrentUser(): User | null {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      if (!sessionToken) {
        return null;
      }

      const storage = this.loadAuthStorage();
      this.cleanExpiredSessions();

      const session = storage.sessions[sessionToken];
      if (!session || session.expiresAt < new Date()) {
        localStorage.removeItem('sessionToken');
        return null;
      }

      const user = storage.users[session.userId];
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Update user profile
  async updateProfile(updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const storage = this.loadAuthStorage();
    const user = storage.users[currentUser.id];
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updates.email && updates.email !== user.email) {
      const existingUser = Object.values(storage.users).find(u => u.email === updates.email);
      if (existingUser) {
        throw new Error('Email is already taken');
      }
    }

    // Update user
    const updatedUser = {
      ...user,
      ...updates
    };

    storage.users[currentUser.id] = updatedUser;
    this.saveAuthStorage(storage);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      createdAt: updatedUser.createdAt,
      lastLoginAt: updatedUser.lastLoginAt
    };
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const storage = this.loadAuthStorage();
    const user = storage.users[currentUser.id];
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const currentPasswordHash = this.hashPassword(currentPassword);
    if (user.passwordHash !== currentPasswordHash) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.passwordHash = this.hashPassword(newPassword);
    storage.users[currentUser.id] = user;
    this.saveAuthStorage(storage);
  }

  // Clear all authentication data
  clearAllAuthData(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('sessionToken');
  }
}

export const authService = AuthService.getInstance();