/**
 * Order Service - Order shipping and delivery management
 */
import apiClient from '../core/ApiClient.js';

class OrderService {
  /**
   * Mark order as shipped (Manufacturer only)
   * @param {string} responseId - Requirement response ID
   * @param {string} trackingId - Tracking ID (required by shipping flow)
   * @param {string} courierName - Courier/provider name (required by shipping flow)
   * @param {string} notes - Optional notes
   * @returns {Promise} Response data
   */
  async markAsShipped(responseId, trackingId = '', courierName = '', notes = '') {
    return apiClient.request(`/orders/ship/${responseId}`, {
      method: 'POST',
      body: JSON.stringify({ trackingId, courierName, notes })
    });
  }

  /**
   * Get orders ready to ship (Manufacturer only)
   * @returns {Promise} Response data with orders ready to ship
   */
  async getReadyToShipOrders() {
    return apiClient.request('/orders/ready-to-ship', {
      method: 'GET'
    });
  }

  /**
   * Confirm delivery of an order (Buyer only)
   * @param {string} responseId - Requirement response ID
   * @returns {Promise} Response data
   */
  async confirmDelivery(responseId) {
    return apiClient.request(`/orders/confirm-delivery/${responseId}`, {
      method: 'POST'
    });
  }
}

// Create singleton instance
const orderService = new OrderService();

export default orderService;
