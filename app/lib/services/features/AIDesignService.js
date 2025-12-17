/**
 * AI Design Service - AI designs & responses
 */
import apiClient from '../core/ApiClient.js';
import { getToken } from '../utils/tokenManager.js';

class AIDesignService {
  /**
   * Get AI designs for the authenticated buyer
   * @param {Object} filters - Optional filters (status, apparel_type, limit, offset, include_responses)
   * @param {boolean} filters.include_responses - If true, includes responses in the response (optimizes N+1 queries)
   * @returns {Promise} Response data
   */
  async getAIDesigns(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.apparel_type) queryParams.append('apparel_type', filters.apparel_type);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    if (filters.include_responses === true) queryParams.append('include_responses', 'true');

    const queryString = queryParams.toString();
    const endpoint = `/ai-designs${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get a single AI design by ID
   * @param {string} aiDesignId - AI design ID
   * @returns {Promise} Response data
   */
  async getAIDesign(aiDesignId) {
    return apiClient.request(`/ai-designs/${aiDesignId}`, {
      method: 'GET'
    });
  }

  /**
   * Push an AI design to manufacturers (change status to published)
   * @param {string} designId - AI design ID
   * @returns {Promise} Response data
   */
  async pushAIDesign(designId) {
    const token = getToken();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}/api/push-ai-design?id=${designId}`;

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          apiClient.handleTokenExpiration();
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(data.error || `Failed to push design! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Push AI design failed:', error);
      throw error;
    }
  }

  /**
   * Get accepted AI designs for a conversation
   * Returns AI designs where response status is 'accepted' and matches the conversation's buyer_id and manufacturer_id
   * @param {string} conversationId - Conversation ID
   * @returns {Promise} Response data
   */
  async getAcceptedAIDesignsForConversation(conversationId) {
    return apiClient.request(`/ai-designs/conversation/${conversationId}/accepted`, {
      method: 'GET'
    });
  }

  /**
   * Create a response to an AI design (manufacturer responds)
   * @param {Object} responseData - Response data (ai_design_id, price_per_unit, quantity)
   * @returns {Promise} Response data
   */
  async createAIDesignResponse(responseData) {
    try {
      return await apiClient.request('/ai-design-responses', {
        method: 'POST',
        body: JSON.stringify(responseData)
      });
    } catch (error) {
      // Re-throw with better error handling for duplicate responses
      if (error.response && error.response.status === 409) {
        throw new Error('You have already responded to this AI design. You can only respond once per design.');
      }
      throw error;
    }
  }

  /**
   * Get AI design responses
   * @param {string} aiDesignId - Optional AI design ID to filter responses
   * @returns {Promise} Response data
   */
  async getAIDesignResponses(aiDesignId = null) {
    const query = aiDesignId ? `?ai_design_id=${aiDesignId}` : '';
    return apiClient.request(`/ai-design-responses${query}`, {
      method: 'GET'
    });
  }

  /**
   * Update AI design response status (accept/reject)
   * @param {string} responseId - AI design response ID
   * @param {string} status - New status ('accepted' or 'rejected')
   * @returns {Promise} Response data
   */
  async updateAIDesignResponseStatus(responseId, status) {
    return apiClient.request(`/ai-design-responses/${responseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
}

// Create singleton instance
const aiDesignService = new AIDesignService();

export default aiDesignService;

