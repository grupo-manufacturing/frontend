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
   * Generate an AI design using Gemini AI
   * @param {Object} options - Design generation options
   * @param {string} options.apparel_type - Type of apparel
   * @param {string} [options.theme_concept] - Theme or concept
   * @param {string} [options.print_placement] - Print placement location
   * @param {string} [options.main_elements] - Main elements to include
   * @param {string} [options.preferred_colors] - Preferred color scheme
   * @returns {Promise} Response data with base64 image
   */
  async generateDesign(options) {
    return apiClient.request('/ai-designs/generate', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  /**
   * Extract design pattern from an apparel image using Gemini AI
   * @param {Object} options - Extraction options
   * @param {string} options.image_url - URL of the image to extract from
   * @param {string} [options.design_id] - Optional design ID to update pattern_url
   * @returns {Promise} Response data with extracted image URL
   */
  async extractDesign(options) {
    return apiClient.request('/ai-designs/extract', {
      method: 'POST',
      body: JSON.stringify({
        image_url: options.image_url,
        design_id: options.design_id
      })
    });
  }

  /**
   * Publish an AI design (create new design record)
   * @param {Object} designData - Design data
   * @param {string} designData.image_url - Image URL (can be base64)
   * @param {string} designData.apparel_type - Type of apparel
   * @param {string} [designData.design_description] - Design description
   * @param {number} designData.quantity - Quantity
   * @param {string} [designData.preferred_colors] - Preferred colors
   * @param {string} [designData.print_placement] - Print placement
   * @returns {Promise} Response data
   */
  async publishAIDesign(designData) {
    return apiClient.request('/ai-designs', {
      method: 'POST',
      body: JSON.stringify({
        image_url: designData.image_url,
        apparel_type: designData.apparel_type,
        design_description: designData.design_description || null,
        quantity: parseInt(designData.quantity),
        preferred_colors: designData.preferred_colors || null,
        print_placement: designData.print_placement || null,
        status: 'draft'
      })
    });
  }

  /**
   * Push an AI design to manufacturers (change status to published)
   * @param {string} designId - AI design ID
   * @returns {Promise} Response data
   */
  async pushAIDesign(designId) {
    return apiClient.request(`/ai-designs/${designId}/push`, {
      method: 'PATCH'
    });
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

  /**
   * Delete an AI design
   * @param {string} designId - AI design ID
   * @returns {Promise} Response data
   */
  async deleteAIDesign(designId) {
    return apiClient.request(`/ai-designs/${designId}`, {
      method: 'DELETE'
    });
  }
}

// Create singleton instance
const aiDesignService = new AIDesignService();

export default aiDesignService;

