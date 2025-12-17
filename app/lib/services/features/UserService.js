/**
 * User Service - Buyer & manufacturer profiles
 */
import apiClient from '../core/ApiClient.js';

class UserService {
  /**
   * Get manufacturer profile
   * @returns {Promise} Response data
   */
  async getManufacturerProfile() {
    return apiClient.request('/auth/manufacturer-profile', {
      method: 'GET'
    });
  }

  /**
   * Update manufacturer profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Response data
   */
  async updateManufacturerProfile(profileData) {
    return apiClient.request('/auth/manufacturer-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Get buyer profile
   * @returns {Promise} Response data
   */
  async getBuyerProfile() {
    return apiClient.request('/auth/buyer-profile', {
      method: 'GET'
    });
  }

  /**
   * Update buyer profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Response data
   */
  async updateBuyerProfile(profileData) {
    return apiClient.request('/auth/buyer-profile', {
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
    
    return apiClient.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get all buyers
   * @param {Object} filters - Optional filters (sortBy, sortOrder, limit, offset)
   * @returns {Promise} Response data
   */
  async getAllBuyers(filters = {}) {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const queryString = queryParams.toString();
    const endpoint = `/buyers${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.request(endpoint, {
      method: 'GET'
    });
  }
}

// Create singleton instance
const userService = new UserService();

export default userService;

