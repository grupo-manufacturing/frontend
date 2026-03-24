/**
 * Payment Service - Buyer payment operations
 */
import apiClient from '../core/ApiClient.js';

class PaymentService {
  /**
   * Create a payment QR code for a requirement response
   * @param {string} requirementResponseId - Requirement response ID
   * @param {number} paymentNumber - Payment number (1 = first 50%, 2 = second 50%)
   * @returns {Promise} Response with QR code data
   */
  async createPaymentQR(requirementResponseId, paymentNumber) {
    return apiClient.request('/payments/create-qr', {
      method: 'POST',
      body: JSON.stringify({
        requirement_response_id: requirementResponseId,
        payment_number: paymentNumber
      })
    });
  }

  /**
   * Submit UTR number after payment
   * @param {string} paymentId - Payment ID
   * @param {string} utrNumber - UTR number from UPI transaction
   * @returns {Promise} Response data
   */
  async submitUTR(paymentId, utrNumber) {
    return apiClient.request('/payments/submit-utr', {
      method: 'POST',
      body: JSON.stringify({
        payment_id: paymentId,
        utr_number: utrNumber
      })
    });
  }

  /**
   * Get payment status for a requirement response
   * @param {string} requirementResponseId - Requirement response ID
   * @returns {Promise} Response with payment records
   */
  async getPaymentStatus(requirementResponseId) {
    return apiClient.request(`/payments/status/${requirementResponseId}`, {
      method: 'GET'
    });
  }

  /**
   * Get all payments for the current user
   * @param {Object} options - Optional filters (status, limit, offset)
   * @returns {Promise} Response with payment records
   */
  async getMyPayments(options = {}) {
    const queryParams = new URLSearchParams();
    if (options.status) queryParams.append('status', options.status);
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.offset) queryParams.append('offset', options.offset);

    const queryString = queryParams.toString();
    const endpoint = `/payments/my-payments${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.request(endpoint, {
      method: 'GET'
    });
  }
}

// Create singleton instance
const paymentService = new PaymentService();

export default paymentService;
