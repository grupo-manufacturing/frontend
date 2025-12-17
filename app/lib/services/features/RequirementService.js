/**
 * Requirement Service - Requirements & responses
 */
import apiClient from '../core/ApiClient.js';

class RequirementService {
  /**
   * Create a new requirement
   * @param {Object} requirementData - Requirement data
   * @returns {Promise} Response data
   */
  async createRequirement(requirementData) {
    return apiClient.request('/requirements', {
      method: 'POST',
      body: JSON.stringify(requirementData)
    });
  }

  /**
   * Get all requirements (buyer gets their own, manufacturer gets all)
   * @param {Object} filters - Optional filters (limit, offset, sortBy, sortOrder)
   * @returns {Promise} Response data
   */
  async getRequirements(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/requirements${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get negotiating and accepted requirements for a conversation
   * Returns requirements where status is 'negotiating' or 'accepted' and matches the conversation's buyer_id and manufacturer_id
   * @param {string} conversationId - Conversation ID
   * @returns {Promise} Response data
   */
  async getNegotiatingRequirementsForConversation(conversationId) {
    return apiClient.request(`/requirements/conversation/${conversationId}/negotiating`, {
      method: 'GET'
    });
  }

  /**
   * Get a single requirement by ID
   * @param {string} requirementId - Requirement ID
   * @returns {Promise} Response data
   */
  async getRequirement(requirementId) {
    return apiClient.request(`/requirements/${requirementId}`, {
      method: 'GET'
    });
  }

  /**
   * Update a requirement
   * @param {string} requirementId - Requirement ID
   * @param {Object} updateData - Data to update
   * @returns {Promise} Response data
   */
  async updateRequirement(requirementId, updateData) {
    return apiClient.request(`/requirements/${requirementId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  /**
   * Delete a requirement
   * @param {string} requirementId - Requirement ID
   * @returns {Promise} Response data
   */
  async deleteRequirement(requirementId) {
    return apiClient.request(`/requirements/${requirementId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Create a response to a requirement (manufacturer responds)
   * @param {string} requirementId - Requirement ID
   * @param {Object} responseData - Response data (quoted_price, price_per_unit, delivery_time, notes)
   * @returns {Promise} Response data
   */
  async createRequirementResponse(requirementId, responseData) {
    return apiClient.request(`/requirements/${requirementId}/responses`, {
      method: 'POST',
      body: JSON.stringify(responseData)
    });
  }

  /**
   * Get responses for a requirement
   * @param {string} requirementId - Requirement ID
   * @returns {Promise} Response data
   */
  async getRequirementResponses(requirementId) {
    return apiClient.request(`/requirements/${requirementId}/responses`, {
      method: 'GET'
    });
  }

  /**
   * Get a single requirement response by ID
   * @param {string} responseId - Response ID
   * @returns {Promise} Response data
   */
  async getRequirementResponse(responseId) {
    return apiClient.request(`/requirements/responses/${responseId}`, {
      method: 'GET'
    });
  }

  /**
   * Get manufacturer's own responses
   * @param {Object} filters - Optional filters
   * @returns {Promise} Response data
   */
  async getMyRequirementResponses(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/requirements/responses/my-responses${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Update requirement response status (accept/reject)
   * @param {string} responseId - Response ID
   * @param {string} status - New status ('accepted' or 'rejected')
   * @returns {Promise} Response data
   */
  async updateRequirementResponseStatus(responseId, status) {
    return apiClient.request(`/requirements/responses/${responseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  /**
   * Get buyer requirement statistics
   * @returns {Promise} Response data with statistics (total, accepted, pending_review, in_negotiation)
   */
  async getBuyerRequirementStatistics() {
    return apiClient.request('/requirements/buyer/statistics', {
      method: 'GET'
    });
  }
}

// Create singleton instance
const requirementService = new RequirementService();

export default requirementService;

