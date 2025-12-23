/**
 * Design Generation Service - Track daily design generation limits
 * Uses buyer profile endpoints instead of separate routes
 */
import apiClient from '../core/ApiClient.js';

class DesignGenerationService {
  /**
   * Get current design generation status
   * @returns {Promise} Response data with count, remaining, limit, canGenerate
   */
  async getStatus() {
    return apiClient.request('/auth/buyer-profile/design-generation-status', {
      method: 'GET'
    });
  }

  /**
   * Increment design generation count
   * @returns {Promise} Response data with updated count, remaining, limit, canGenerate
   */
  async increment() {
    return apiClient.request('/auth/buyer-profile/increment-design-generation', {
      method: 'POST'
    });
  }
}

// Create singleton instance
const designGenerationService = new DesignGenerationService();

export default designGenerationService;

