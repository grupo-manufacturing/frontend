/**
 * Services Index - Re-exports all services
 * 
 * This file provides a unified API for all services, maintaining backward compatibility
 * with the original apiService.js structure.
 */

// Core services
import apiClient, { API_BASE_URL } from './core/ApiClient.js';
import authService from './core/AuthService.js';

// Feature services
import chatService from './features/ChatService.js';
import requirementService from './features/RequirementService.js';
import userService from './features/UserService.js';
import adminService from './features/AdminService.js';
import paymentService from './features/PaymentService.js';
import milestoneService from './features/MilestoneService.js';
import orderService from './features/OrderService.js';

// Utils
import * as tokenManager from './utils/tokenManager.js';

/**
 * Unified API Service - Combines all services into a single interface
 * This maintains backward compatibility with the original apiService.js
 */
class ApiService {
  constructor() {
    // Core
    this.baseURL = apiClient.getBaseURL();
    
    // Auth methods
    this.sendOTP = authService.sendOTP.bind(authService);
    this.verifyOTP = authService.verifyOTP.bind(authService);
    this.refreshToken = authService.refreshToken.bind(authService);
    this.verifyToken = authService.verifyToken.bind(authService);
    this.getOTPStatus = authService.getOTPStatus.bind(authService);
    this.setToken = authService.setToken.bind(authService);
    this.getToken = authService.getToken.bind(authService);
    this.removeToken = authService.removeToken.bind(authService);
    this.clearAllAuthData = authService.clearAllAuthData.bind(authService);
    this.isAuthenticated = authService.isAuthenticated.bind(authService);
    this.submitManufacturerOnboarding = authService.submitManufacturerOnboarding.bind(authService);
    this.submitBuyerOnboarding = authService.submitBuyerOnboarding.bind(authService);
    this.adminLogin = authService.adminLogin.bind(authService);
    this.logout = authService.logout.bind(authService);
    
    // Chat methods
    this.listConversations = chatService.listConversations.bind(chatService);
    this.ensureConversation = chatService.ensureConversation.bind(chatService);
    this.listMessages = chatService.listMessages.bind(chatService);
    this.getMessagesForRequirement = chatService.getMessagesForRequirement.bind(chatService);
    this.sendMessage = chatService.sendMessage.bind(chatService);
    this.uploadChatFile = chatService.uploadChatFile.bind(chatService);
    this.uploadMultipleChatFiles = chatService.uploadMultipleChatFiles.bind(chatService);
    this.markRead = chatService.markRead.bind(chatService);
    
    // Requirement methods
    this.uploadRequirementFile = requirementService.uploadRequirementFile.bind(requirementService);
    this.createRequirement = requirementService.createRequirement.bind(requirementService);
    this.getRequirements = requirementService.getRequirements.bind(requirementService);
    this.getActiveRequirementsForConversation = requirementService.getActiveRequirementsForConversation.bind(requirementService);
    this.getRequirement = requirementService.getRequirement.bind(requirementService);
    this.updateRequirement = requirementService.updateRequirement.bind(requirementService);
    this.deleteRequirement = requirementService.deleteRequirement.bind(requirementService);
    this.createRequirementResponse = requirementService.createRequirementResponse.bind(requirementService);
    this.getRequirementResponses = requirementService.getRequirementResponses.bind(requirementService);
    this.getRequirementResponse = requirementService.getRequirementResponse.bind(requirementService);
    this.getMyRequirementResponses = requirementService.getMyRequirementResponses.bind(requirementService);
    this.updateRequirementResponseStatus = requirementService.updateRequirementResponseStatus.bind(requirementService);
    this.getBuyerRequirementStatistics = requirementService.getBuyerRequirementStatistics.bind(requirementService);
    
    // User methods
    this.getManufacturerProfile = userService.getManufacturerProfile.bind(userService);
    this.updateManufacturerProfile = userService.updateManufacturerProfile.bind(userService);
    this.getBuyerProfile = userService.getBuyerProfile.bind(userService);
    this.updateBuyerProfile = userService.updateBuyerProfile.bind(userService);
    this.getAllManufacturers = userService.getAllManufacturers.bind(userService);
    this.getAllBuyers = userService.getAllBuyers.bind(userService);
    
    // Admin methods
    this.updateManufacturerVerifiedStatus = adminService.updateManufacturerVerifiedStatus.bind(adminService);
    this.getOrders = adminService.getOrders.bind(adminService);
    this.getAcceptedOrders = adminService.getAcceptedOrders.bind(adminService);
    this.getRejectedOrders = adminService.getRejectedOrders.bind(adminService);
    this.getPendingOrders = adminService.getPendingOrders.bind(adminService);
    this.getOverviewMetrics = adminService.getOverviewMetrics.bind(adminService);
    
    // Payment verification methods (Admin)
    this.getPendingPayments = adminService.getPendingPayments.bind(adminService);
    this.verifyPayment = adminService.verifyPayment.bind(adminService);
    this.refundPayment = adminService.refundPayment.bind(adminService);
    
    // Payment methods (Buyer)
    this.createPaymentQR = paymentService.createPaymentQR.bind(paymentService);
    this.submitUTR = paymentService.submitUTR.bind(paymentService);
    this.getPaymentStatus = paymentService.getPaymentStatus.bind(paymentService);
    this.getMyPayments = paymentService.getMyPayments.bind(paymentService);
    
    // Milestone methods
    this.markMilestoneComplete = milestoneService.markMilestoneComplete.bind(milestoneService);
    this.approveMilestone = milestoneService.approveMilestone.bind(milestoneService);
    this.markMilestonePaid = milestoneService.markMilestonePaid.bind(milestoneService);
    this.markFinalPaid = milestoneService.markFinalPaid.bind(milestoneService);
    this.getPendingPayouts = milestoneService.getPendingPayouts.bind(milestoneService);
    this.getMilestoneStatus = milestoneService.getMilestoneStatus.bind(milestoneService);
    
    // Order methods
    this.markAsShipped = orderService.markAsShipped.bind(orderService);
    this.getReadyToShipOrders = orderService.getReadyToShipOrders.bind(orderService);
    this.confirmDelivery = orderService.confirmDelivery.bind(orderService);
    
    // Internal method for token expiration handling (used by ApiClient)
    this.handleTokenExpiration = apiClient.handleTokenExpiration.bind(apiClient);
  }
  
  // Request method for backward compatibility
  async request(endpoint, options = {}) {
    return apiClient.request(endpoint, options);
  }
}

// Create singleton instance (backward compatible)
const apiService = new ApiService();

// Export default for backward compatibility
export default apiService;

// Export individual services for direct access
export {
  apiClient,
  authService,
  chatService,
  requirementService,
  userService,
  adminService,
  paymentService,
  milestoneService,
  orderService,
  tokenManager,
  API_BASE_URL
};

// Export helper function
export const getApiBaseOrigin = () => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
};

