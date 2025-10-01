// Vendure Authentication Token Manager
// Handles the vendure-auth-token for session persistence

const AUTH_TOKEN_KEY = 'vendure-auth-token';

class AuthTokenManager {
  private token: string | null = null;

  constructor() {
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(AUTH_TOKEN_KEY);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        console.log('[AuthManager] Token saved to localStorage:', token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        console.log('[AuthManager] Token cleared from localStorage');
      }
    }
  }

  clearToken(): void {
    this.setToken(null);
  }

  // Extract token from response headers if present
  extractTokenFromResponse(response: Response): void {
    const token = response.headers.get('vendure-auth-token');
    if (token) {
      this.setToken(token);
    }
  }
}

export const authManager = new AuthTokenManager();
export default authManager;