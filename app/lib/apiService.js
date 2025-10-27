// API service for Grupo frontend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Make HTTP request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Send OTP to phone number
   * @param {string} phoneNumber - Phone number
   * @returns {Promise} Response data
   */
  async sendOTP(phoneNumber) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    });
  }

  /**
   * Verify OTP
   * @param {string} phoneNumber - Phone number
   * @param {string} otp - OTP code
   * @returns {Promise} Response data
   */
  async verifyOTP(phoneNumber, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp })
    });
  }

  /**
   * Refresh JWT token
   * @returns {Promise} Response data
   */
  async refreshToken() {
    return this.request('/auth/refresh-token', {
      method: 'POST'
    });
  }

  /**
   * Verify JWT token
   * @returns {Promise} Response data
   */
  async verifyToken() {
    return this.request('/auth/verify-token', {
      method: 'GET'
    });
  }

  /**
   * Get OTP status (for debugging)
   * @param {string} phoneNumber - Phone number
   * @returns {Promise} Response data
   */
  async getOTPStatus(phoneNumber) {
    return this.request(`/auth/otp-status/${encodeURIComponent(phoneNumber)}`, {
      method: 'GET'
    });
  }

  /**
   * Store JWT token in localStorage
   * @param {string} token - JWT token
   */
  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('groupo_token', token);
    }
  }

  /**
   * Get JWT token from localStorage
   * @returns {string|null} JWT token
   */
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('groupo_token');
    }
    return null;
  }

  /**
   * Remove JWT token from localStorage
   */
  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('groupo_token');
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Logout user
   */
  logout() {
    this.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
