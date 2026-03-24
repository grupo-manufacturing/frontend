/**
 * Milestone Service - Milestone tracking and payout management
 */
import apiClient from '../core/ApiClient.js';

class MilestoneService {
  /**
   * Mark a milestone as complete (Manufacturer only)
   * @param {string} responseId - Requirement response ID
   * @param {string} milestone - 'm1' or 'm2'
   * @returns {Promise} Response data
   */
  async markMilestoneComplete(responseId, milestone) {
    return apiClient.request('/milestones/complete', {
      method: 'POST',
      body: JSON.stringify({ responseId, milestone })
    });
  }

  /**
   * Approve a milestone (Buyer only)
   * @param {string} responseId - Requirement response ID
   * @param {string} milestone - 'm1' or 'm2'
   * @returns {Promise} Response data
   */
  async approveMilestone(responseId, milestone) {
    return apiClient.request(`/milestones/approve/${responseId}`, {
      method: 'POST',
      body: JSON.stringify({ milestone })
    });
  }

  /**
   * Mark milestone payout as transferred (Admin only)
   * @param {string} responseId - Requirement response ID
   * @param {string} milestone - 'm1' or 'm2'
   * @param {string} transactionRef - Optional transaction reference
   * @param {string} notes - Optional notes
   * @returns {Promise} Response data
   */
  async markMilestonePaid(responseId, milestone, transactionRef = '', notes = '') {
    return apiClient.request(`/milestones/mark-paid/${responseId}`, {
      method: 'POST',
      body: JSON.stringify({ milestone, transactionRef, notes })
    });
  }

  /**
   * Get pending milestone payouts (Admin only)
   * @returns {Promise} Response data with pending payouts
   */
  async getPendingPayouts() {
    return apiClient.request('/milestones/pending-payouts', {
      method: 'GET'
    });
  }

  /**
   * Get milestone status for a response
   * @param {string} responseId - Requirement response ID
   * @returns {Promise} Response data with milestone status
   */
  async getMilestoneStatus(responseId) {
    return apiClient.request(`/milestones/status/${responseId}`, {
      method: 'GET'
    });
  }

  /**
   * Mark final payout as transferred (Admin only)
   * @param {string} responseId - Requirement response ID
   * @param {string} transactionRef - Optional transaction reference
   * @param {string} notes - Optional notes
   * @returns {Promise} Response data
   */
  async markFinalPaid(responseId, transactionRef = '', notes = '') {
    return apiClient.request(`/milestones/mark-final-paid/${responseId}`, {
      method: 'POST',
      body: JSON.stringify({ transactionRef, notes })
    });
  }
}

// Create singleton instance
const milestoneService = new MilestoneService();

export default milestoneService;
