// API service for Grupo frontend
// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://grupo-backend.onrender.com/api';

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
   * @param {string} role - User role ('buyer' or 'manufacturer')
   * @returns {Promise} Response data
   */
  async sendOTP(phoneNumber, role = 'buyer') {
    return this.request('/auth/send-otp', {
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
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp, role })
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
   * Store JWT token in localStorage and cookies
   * @param {string} token - JWT token
   */
  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('groupo_token', token);
      // Also set cookie for server-side middleware access
      document.cookie = `groupo_token=${token}; path=/; max-age=86400; SameSite=Lax`;
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
   * Remove JWT token from localStorage and cookies
   */
  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('groupo_token');
      // Also remove cookie
      document.cookie = 'groupo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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
   * Submit manufacturer onboarding data
   * @param {Object} onboardingData - Onboarding data to submit
   * @returns {Promise} Response data
   */
  async submitManufacturerOnboarding(onboardingData) {
    return this.request('/auth/manufacturer-onboarding', {
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
    return this.request('/auth/buyer-onboarding', {
      method: 'POST',
      body: JSON.stringify(onboardingData)
    });
  }

  /**
   * Get manufacturer profile
   * @returns {Promise} Response data
   */
  async getManufacturerProfile() {
    return this.request('/auth/manufacturer-profile', {
      method: 'GET'
    });
  }

  /**
   * Update manufacturer profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Response data
   */
  async updateManufacturerProfile(profileData) {
    return this.request('/auth/manufacturer-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Get buyer profile
   * @returns {Promise} Response data
   */
  async getBuyerProfile() {
    return this.request('/auth/buyer-profile', {
      method: 'GET'
    });
  }

  /**
   * Update buyer profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Response data
   */
  async updateBuyerProfile(profileData) {
    return this.request('/auth/buyer-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Get all manufacturers
   * @param {Object} filters - Optional filters (verified, verification_status, onboarding_completed, business_type, sortBy, sortOrder, limit, offset)
   * @returns {Promise} Response data
   */
  async getAllManufacturers(filters = {}) {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.verified !== undefined) queryParams.append('verified', filters.verified);
    if (filters.verification_status) queryParams.append('verification_status', filters.verification_status);
    if (filters.onboarding_completed !== undefined) queryParams.append('onboarding_completed', filters.onboarding_completed);
    if (filters.business_type) queryParams.append('business_type', filters.business_type);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const queryString = queryParams.toString();
    const endpoint = `/manufacturers${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get all buyers
   * @param {Object} filters - Optional filters (verified, verification_status, onboarding_completed, sortBy, sortOrder, limit, offset)
   * @returns {Promise} Response data
   */
  async getAllBuyers(filters = {}) {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.verified !== undefined) queryParams.append('verified', filters.verified);
    if (filters.verification_status) queryParams.append('verification_status', filters.verification_status);
    if (filters.onboarding_completed !== undefined) queryParams.append('onboarding_completed', filters.onboarding_completed);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const queryString = queryParams.toString();
    const endpoint = `/buyers${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Logout user (calls backend logout endpoint)
   */
  async logout() {
    try {
      // Call backend logout endpoint if token exists
      if (this.getToken()) {
        await this.request('/auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local storage
      this.removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
