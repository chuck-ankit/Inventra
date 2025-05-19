import { User, PasswordUpdate } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class AuthService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await fetch(`${API_URL}${formattedEndpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-error'));
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
  }

  async register(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/users/profile');
  }

  async updateProfile(updates: Partial<User>): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
  }

  async updatePassword(passwordUpdate: { currentPassword: string; password: string }): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(passwordUpdate),
    });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
  }

  logout() {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-error'));
  }
}

export const authService = new AuthService(); 