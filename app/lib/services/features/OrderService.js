/**
 * Order Service - Order shipping and delivery management
 */
import apiClient from '../core/ApiClient.js';

class OrderService {
  /**
   * Mark order as shipped (Manufacturer only)
   * @param {string} responseId - Requirement response ID
   * @param {string} trackingNumber - Optional tracking number
   * @param {string} shippingProvider - Optional shipping provider name
   * @param {string} notes - Optional notes
   * @returns {Promise} Response data
   */
  async markAsShipped(responseId, trackingNumber = '', shippingProvider = '', notes = '') {
    return apiClient.request(`/orders/ship/${responseId}`, {
      method: 'POST',
      body: JSON.stringify({ trackingNumber, shippingProvider, notes })
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
