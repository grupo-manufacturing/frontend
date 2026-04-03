/**
 * Admin Service - Admin-specific operations
 */
import apiClient from '../core/ApiClient.js';

class AdminService {
  /**
   * Update manufacturer verified status (Admin only)
   * @param {string} manufacturerId - Manufacturer ID
   * @param {boolean} verified - Verification status (true/false)
   * @returns {Promise} Response data
   */
  async updateManufacturerVerifiedStatus(manufacturerId, verified) {
    return apiClient.request(`/manufacturers/${manufacturerId}/verified`, {
      method: 'PATCH',
      body: JSON.stringify({ verified })
    });
  }

  /**
   * Get all orders (Admin only) - can be filtered by status
   * @param {Object} filters - Optional filters (status, limit, offset, sortBy, sortOrder)
   * @param {string} filters.status - Optional: 'accepted', 'rejected', 'submitted' (pending), or omit for all
   * @returns {Promise} Response data with orders
   */
  async getOrders(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/requirements/admin/orders${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get admin overview metrics (Total Revenue, etc.)
   * Currently returns { totalRevenue } summed from requirement_responses.
   */
  async getOverviewMetrics() {
    return apiClient.request('/requirements/admin/metrics/overview', {
      method: 'GET'
    });
  }

  /**
   * Get all accepted orders (Admin only)
   * @param {Object} filters - Optional filters (limit, offset, sortBy, sortOrder)
   * @returns {Promise} Response data with accepted orders
   * @deprecated Use getOrders({ status: 'accepted' }) instead
   */
  async getAcceptedOrders(filters = {}) {
    return this.getOrders({ ...filters, status: 'accepted' });
  }

  /**
   * Get all rejected orders (Admin only)
   * @param {Object} filters - Optional filters (limit, offset, sortBy, sortOrder)
   * @returns {Promise} Response data with rejected orders
   * @deprecated Use getOrders({ status: 'rejected' }) instead
   */
  async getRejectedOrders(filters = {}) {
    return this.getOrders({ ...filters, status: 'rejected' });
  }

  /**
   * Get all pending orders (Admin only)
   * @param {Object} filters - Optional filters (limit, offset, sortBy, sortOrder)
   * @returns {Promise} Response data with pending orders
   * @deprecated Use getOrders({ status: 'submitted' }) instead
   */
  async getPendingOrders(filters = {}) {
    return this.getOrders({ ...filters, status: 'submitted' });
  }

  // =============================================
  // PAYMENT VERIFICATION METHODS
  // =============================================

  /**
   * Get all payments pending verification (Admin only)
   * @param {Object} options - Optional pagination (limit, offset)
   * @returns {Promise} Response data with pending payments
   */
  async getPendingPayments(options = {}) {
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.offset) queryParams.append('offset', options.offset);

    const queryString = queryParams.toString();
    const endpoint = `/payments/admin/pending${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Verify or reject a payment (Admin only)
   * @param {string} paymentId - Payment ID
   * @param {boolean} approved - Whether to approve (true) or reject (false)
   * @param {string} notes - Optional notes
   * @returns {Promise} Response data
   */
  async verifyPayment(paymentId, approved, notes = null) {
    return apiClient.request(`/payments/verify/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify({ approved, notes })
    });
  }

  /**
   * Refund a payment (Admin only)
   * @param {string} paymentId - Payment ID
   * @param {string} reason - Refund reason
   * @returns {Promise} Response data
   */
  async refundPayment(paymentId, reason) {
    return apiClient.request(`/payments/refund/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }
}

// Create singleton instance
const adminService = new AdminService();

export default adminService;

