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
}

// Create singleton instance
const adminService = new AdminService();

export default adminService;

