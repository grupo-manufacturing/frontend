/**
 * Auth Service - All authentication-related methods
 */
import apiClient from './ApiClient.js';
import { setToken as setTokenInStorage, getToken, removeToken, clearAllAuthData } from '../utils/tokenManager.js';

class AuthService {
  /**
   * Send OTP to phone number
   * @param {string} phoneNumber - Phone number
   * @param {string} role - User role ('buyer' or 'manufacturer')
   * @returns {Promise} Response data
   */
  async sendOTP(phoneNumber, role = 'buyer') {
    return apiClient.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, role })
    });
  }

  /**
   * Verify OTP
   * @param {string} phoneNumber - Phone number
   * @param {string} otp - OTP code
   * @param {string} role - User role ('buyer' or 'manufacturer')
   * @returns {Promise} Response data
   */
  async verifyOTP(phoneNumber, otp, role = 'buyer') {
    const response = await apiClient.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp, role })
    });
    
    // Store token if provided
    if (response.token) {
      setTokenInStorage(response.token, role);
    }
    
    return response;
  }

  /**
   * Refresh JWT token
   * @returns {Promise} Response data
   */
  async refreshToken() {
    return apiClient.request('/auth/refresh-token', {
      method: 'POST'
    });
  }

  /**
   * Verify JWT token
   * @returns {Promise} Response data
   */
  async verifyToken() {
    return apiClient.request('/auth/verify-token', {
      method: 'GET'
    });
  }

  /**
   * Get OTP status (for debugging)
   * @param {string} phoneNumber - Phone number
   * @returns {Promise} Response data
   */
  async getOTPStatus(phoneNumber) {
    return apiClient.request(`/auth/otp-status/${encodeURIComponent(phoneNumber)}`, {
      method: 'GET'
    });
  }

  /**
   * Store JWT token in localStorage and cookies
   * @param {string} token - JWT token
   * @param {string} tokenType - Token type: 'buyer', 'manufacturer', or 'admin' (defaults to 'buyer' for backward compatibility)
   */
  setToken(token, tokenType = 'buyer') {
    setTokenInStorage(token, tokenType);
  }

  /**
   * Get JWT token from localStorage
   * Route-aware: returns the appropriate token based on current route
   * @returns {string|null} JWT token
   */
  getToken() {
    return getToken();
  }

  /**
   * Remove JWT token from localStorage and cookies
   * @param {string} tokenType - Token type: 'buyer', 'manufacturer', 'admin', or 'all' (default)
   */
  removeToken(tokenType = 'all') {
    removeToken(tokenType);
  }

  /**
   * Clear all authentication-related localStorage items
   */
  clearAllAuthData() {
    clearAllAuthData();
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Is authenticated
   */
  isAuthenticated() {
    return !!getToken();
  }

  /**
   * Submit manufacturer onboarding data
   * @param {Object} onboardingData - Onboarding data to submit
   * @returns {Promise} Response data
   */
  async submitManufacturerOnboarding(onboardingData) {
    return apiClient.request('/auth/manufacturer-onboarding', {
      method: 'POST',
      body: JSON.stringify(onboardingData)
    });
  }

  /**
   * Submit buyer onboarding data
   * @param {Object} onboardingData - Onboarding data to submit
   * @returns {Promise} Response data
   */
  async submitBuyerOnboarding(onboardingData) {
    return apiClient.request('/auth/buyer-onboarding', {
      method: 'POST',
      body: JSON.stringify(onboardingData)
    });
  }

  /**
   * Admin login with username and password
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {Promise} Response data with token
   */
  async adminLogin(username, password) {
    const response = await apiClient.request('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    // Store admin token if provided
    if (response.token) {
      setTokenInStorage(response.token, 'admin');
    }
    
    return response;
  }

  /**
   * Logout user (calls backend logout endpoint)
   * @param {string} [redirectPath='/'] - Path to navigate to after logout
   */
  async logout(redirectPath = '/') {
    try {
      // Determine which token to clear based on current route
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      let tokenType = 'all';
      
      if (currentPath.startsWith('/buyer-portal')) {
        tokenType = 'buyer';
      } else if (currentPath.startsWith('/manufacturer-portal')) {
        tokenType = 'manufacturer';
      } else if (currentPath.startsWith('/admin')) {
        tokenType = 'admin';
      }
      
      // Call backend logout endpoint if token exists
      if (getToken()) {
        await apiClient.request('/auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear only the token for the current portal
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      if (currentPath.startsWith('/buyer-portal')) {
        removeToken('buyer');
      } else if (currentPath.startsWith('/manufacturer-portal')) {
        removeToken('manufacturer');
      } else if (currentPath.startsWith('/admin')) {
        removeToken('admin');
      } else {
        // For other routes, clear all
        clearAllAuthData();
      }
      
      if (typeof window !== 'undefined') {
        window.location.href = redirectPath;
      }
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;

