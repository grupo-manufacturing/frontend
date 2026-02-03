/**
 * API Client - Base HTTP client with auth handling
 */
import { getToken, setToken, removeToken, clearAllAuthData } from '../utils/tokenManager.js';

// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-47rb.onrender.com/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get token type from current path for storage
   * @private
   */
  _getTokenType() {
    if (typeof window === 'undefined') return 'buyer';
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/manufacturer-portal')) return 'manufacturer';
    if (path.startsWith('/buyer-portal')) return 'buyer';
    return 'buyer';
  }

  /**
   * Try to refresh the JWT once (raw fetch to avoid recursion). Returns true if new token stored.
   * @private
   */
  async _tryRefreshToken() {
    const token = getToken();
    if (!token) return false;
    try {
      const url = `${this.baseURL}/auth/refresh-token`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) return false;
      const contentType = response.headers.get('content-type');
      const data = contentType?.includes('application/json') ? await response.json() : {};
      const newToken = data?.data?.token || data?.token;
      if (newToken) {
        setToken(newToken, this._getTokenType());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Handle token expiration - redirect to appropriate portal login
   * @private
   */
  handleTokenExpiration() {
    if (typeof window === 'undefined') return;
    
    const currentPath = window.location.pathname;
    
    // Clear only the token for the current portal, not all tokens
    if (currentPath.startsWith('/buyer-portal')) {
      removeToken('buyer');
      window.location.href = '/buyer-portal';
    } else if (currentPath.startsWith('/manufacturer-portal')) {
      removeToken('manufacturer');
      window.location.href = '/manufacturer-portal';
    } else if (currentPath.startsWith('/admin')) {
      removeToken('admin');
      window.location.href = '/admin';
    } else {
      // For other routes, clear all auth data
      clearAllAuthData();
    }
  }

  /**
   * Make HTTP request. On 401, tries refresh once and retries; otherwise clears token and redirects.
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {boolean} [skipRefresh=false] - Internal: skip refresh attempt (used when retrying after refresh)
   * @returns {Promise} Response data
   */
  async request(endpoint, options = {}, skipRefresh = false) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Check if response has JSON content
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, get text response
        const text = await response.text();
        data = { message: text || `HTTP error! status: ${response.status}` };
      }

      if (!response.ok) {
        // Handle token expiration (401 Unauthorized): try refresh once, then retry or redirect
        if (response.status === 401) {
          if (!skipRefresh && (await this._tryRefreshToken())) {
            return this.request(endpoint, options, true);
          }
          this.handleTokenExpiration();
          throw new Error('Your session has expired. Please log in again.');
        }
        // Handle 404 and other errors more gracefully
        const errorMessage = data?.message || data?.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      // If it's already an Error object, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      // Otherwise, wrap it in an Error
      throw new Error(error.message || 'API request failed');
    }
  }

  /**
   * Get API base URL
   * @returns {string} Base URL
   */
  getBaseURL() {
    return this.baseURL;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
export { API_BASE_URL };

