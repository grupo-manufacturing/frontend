// API service for Grupo frontend
// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://grupo-backend.onrender.com/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Handle token expiration - redirect to appropriate portal login
   * @private
   */
  handleTokenExpiration() {
    if (typeof window === 'undefined') return;
    
    const currentPath = window.location.pathname;
    
    // Clear only the token for the current portal, not all tokens
    if (currentPath.startsWith('/buyer-portal')) {
      this.removeToken('buyer');
      window.location.href = '/buyer-portal';
    } else if (currentPath.startsWith('/manufacturer-portal')) {
      this.removeToken('manufacturer');
      window.location.href = '/manufacturer-portal';
    } else if (currentPath.startsWith('/admin')) {
      this.removeToken('admin');
      window.location.href = '/admin';
    } else {
      // For other routes, clear all auth data
      this.clearAllAuthData();
    }
  }

  /**
   * Make HTTP request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration (401 Unauthorized)
        if (response.status === 401) {
          this.handleTokenExpiration();
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // =====================
  // Chat API
  // =====================

  async listConversations({ search, limit = 50, cursor, offset } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', String(limit));
    if (cursor) params.append('cursor', cursor);
    if (offset !== undefined) params.append('offset', String(offset));
    const qs = params.toString();
    return this.request(`/chat/conversations${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }

  async ensureConversation(buyerId, manufacturerId) {
    return this.request('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ buyerId, manufacturerId })
    });
  }

  async listMessages(conversationId, { before, limit = 50, requirementId } = {}) {
    const params = new URLSearchParams();
    if (before) params.append('before', before);
    if (limit) params.append('limit', String(limit));
    if (requirementId) params.append('requirementId', requirementId);
    const qs = params.toString();
    return this.request(`/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }

  /**
   * Get messages for a specific requirement in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} requirementId - Requirement ID
   * @param {Object} options - Query options (before, limit)
   * @returns {Promise} Response data with messages
   */
  async getMessagesForRequirement(conversationId, requirementId, { before, limit = 200 } = {}) {
    const params = new URLSearchParams();
    if (before) params.append('before', before);
    if (limit) params.append('limit', String(limit));
    const qs = params.toString();
    return this.request(`/chat/conversations/${conversationId}/messages/requirement/${requirementId}${qs ? `?${qs}` : ''}`, { 
      method: 'GET' 
    });
  }

  async sendMessage(conversationId, { body, clientTempId, attachments, requirementId }) {
    return this.request(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, clientTempId, attachments, requirementId })
    });
  }

  /**
   * Upload a file for chat
   * @param {File} file - File to upload
   * @param {string} conversationId - Conversation ID
   * @returns {Promise} Upload result with file URL and metadata
   */
  async uploadChatFile(file, conversationId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    const token = this.getToken();
    const url = `${this.baseURL}/upload/chat-file`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration (401 Unauthorized)
        if (response.status === 401) {
          this.handleTokenExpiration();
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(data.message || `Upload failed! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files for chat
   * @param {FileList|File[]} files - Files to upload
   * @param {string} conversationId - Conversation ID
   * @returns {Promise} Upload results
   */
  async uploadMultipleChatFiles(files, conversationId) {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('conversationId', conversationId);

    const token = this.getToken();
    const url = `${this.baseURL}/upload/multiple`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration (401 Unauthorized)
        if (response.status === 401) {
          this.handleTokenExpiration();
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(data.message || `Upload failed! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Multiple file upload failed:', error);
      throw error;
    }
  }

  async markRead(conversationId, { upTo, upToMessageId } = {}) {
    const payload = {};
    if (upTo) payload.upTo = upTo;
    if (upToMessageId) payload.upToMessageId = upToMessageId;
    return this.request(`/chat/conversations/${conversationId}/read`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Send OTP to phone number
   * @param {string} phoneNumber - Phone number
   * @param {string} role - User role ('buyer' or 'manufacturer')
   * @returns {Promise} Response data
   */
  async sendOTP(phoneNumber, role = 'buyer') {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, role })
    });
  }

  /**
   * Verify OTP
   * @param {string} phoneNumber - Phone number
   * @param {string} otp - OTP code
   * @param {string} role - User role ('buyer' or 'manufacturer')
   * @returns {Promise} Response data
   */
  async verifyOTP(phoneNumber, otp, role = 'buyer') {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp, role })
    });
  }

  /**
   * Refresh JWT token
   * @returns {Promise} Response data
   */
  async refreshToken() {
    return this.request('/auth/refresh-token', {
      method: 'POST'
    });
  }

  /**
   * Verify JWT token
   * @returns {Promise} Response data
   */
  async verifyToken() {
    return this.request('/auth/verify-token', {
      method: 'GET'
    });
  }

  /**
   * Get OTP status (for debugging)
   * @param {string} phoneNumber - Phone number
   * @returns {Promise} Response data
   */
  async getOTPStatus(phoneNumber) {
    return this.request(`/auth/otp-status/${encodeURIComponent(phoneNumber)}`, {
      method: 'GET'
    });
  }

  /**
   * Store JWT token in localStorage and cookies
   * @param {string} token - JWT token
   * @param {string} tokenType - Token type: 'buyer', 'manufacturer', or 'admin' (defaults to 'buyer' for backward compatibility)
   */
  setToken(token, tokenType = 'buyer') {
    if (typeof window !== 'undefined') {
      if (tokenType === 'admin') {
        localStorage.setItem('adminToken', token);
      } else if (tokenType === 'manufacturer') {
        localStorage.setItem('manufacturerToken', token);
      } else {
        // Default to buyer for backward compatibility
        localStorage.setItem('buyerToken', token);
        // Also set cookie for server-side middleware access (backward compatibility)
        document.cookie = `groupo_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      }
    }
  }

  /**
   * Get JWT token from localStorage
   * Route-aware: returns the appropriate token based on current route
   * @returns {string|null} JWT token
   */
  getToken() {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      
      // Route-aware token selection
      if (currentPath.startsWith('/admin')) {
        // On admin routes, return admin token
        return localStorage.getItem('adminToken');
      } else if (currentPath.startsWith('/buyer-portal')) {
        // On buyer routes, return buyer token
        return localStorage.getItem('buyerToken');
      } else if (currentPath.startsWith('/manufacturer-portal')) {
        // On manufacturer routes, return manufacturer token
        return localStorage.getItem('manufacturerToken');
      } else {
        // For other routes, try buyer token first (backward compatibility)
        // Then try manufacturer token, then admin token
        return localStorage.getItem('buyerToken') || 
               localStorage.getItem('manufacturerToken') || 
               localStorage.getItem('adminToken');
      }
    }
    return null;
  }

  /**
   * Remove JWT token from localStorage and cookies
   * @param {string} tokenType - Token type: 'buyer', 'manufacturer', 'admin', or 'all' (default)
   */
  removeToken(tokenType = 'all') {
    if (typeof window !== 'undefined') {
      if (tokenType === 'admin') {
        localStorage.removeItem('adminToken');
      } else if (tokenType === 'buyer') {
        localStorage.removeItem('buyerToken');
        // Also clear legacy cookie for backward compatibility
        document.cookie = 'groupo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } else if (tokenType === 'manufacturer') {
        localStorage.removeItem('manufacturerToken');
      } else {
        // Remove all tokens
        localStorage.removeItem('buyerToken');
        localStorage.removeItem('manufacturerToken');
        localStorage.removeItem('adminToken');
        // Also remove legacy token for backward compatibility
        localStorage.removeItem('groupo_token');
        document.cookie = 'groupo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
  }

  /**
   * Clear all authentication-related localStorage items
   */
  clearAllAuthData() {
    if (typeof window !== 'undefined') {
      // Clear all tokens
      localStorage.removeItem('buyerToken');
      localStorage.removeItem('manufacturerToken');
      localStorage.removeItem('adminToken');
      // Also remove legacy token for backward compatibility
      localStorage.removeItem('groupo_token');
      
      // Clear buyer-related data
      localStorage.removeItem('buyerPhoneNumber');
      localStorage.removeItem('buyerId');
      
      // Clear manufacturer-related data
      localStorage.removeItem('manufacturerPhoneNumber');
      localStorage.removeItem('manufacturerOnboardingComplete');
      
      // Clear role data
      localStorage.removeItem('user_role');
      
      // Also remove cookie
      document.cookie = 'groupo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Submit manufacturer onboarding data
   * @param {Object} onboardingData - Onboarding data to submit
   * @returns {Promise} Response data
   */
  async submitManufacturerOnboarding(onboardingData) {
    return this.request('/auth/manufacturer-onboarding', {
      method: 'POST',
      body: JSON.stringify(onboardingData)
    });
  }

  /**
   * Submit buyer onboarding data
   * @param {Object} onboardingData - Onboarding data to submit
   * @returns {Promise} Response data
   */
  async submitBuyerOnboarding(onboardingData) {
    return this.request('/auth/buyer-onboarding', {
      method: 'POST',
      body: JSON.stringify(onboardingData)
    });
  }

  /**
   * Get manufacturer profile
   * @returns {Promise} Response data
   */
  async getManufacturerProfile() {
    return this.request('/auth/manufacturer-profile', {
      method: 'GET'
    });
  }

  /**
   * Update manufacturer profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Response data
   */
  async updateManufacturerProfile(profileData) {
    return this.request('/auth/manufacturer-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Get buyer profile
   * @returns {Promise} Response data
   */
  async getBuyerProfile() {
    return this.request('/auth/buyer-profile', {
      method: 'GET'
    });
  }

  /**
   * Update buyer profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Response data
   */
  async updateBuyerProfile(profileData) {
    return this.request('/auth/buyer-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Get all manufacturers
   * @param {Object} filters - Optional filters (verified, verification_status, onboarding_completed, business_type, sortBy, sortOrder, limit, offset)
   * @returns {Promise} Response data
   */
  async getAllManufacturers(filters = {}) {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.verified !== undefined) queryParams.append('verified', filters.verified);
    if (filters.verification_status) queryParams.append('verification_status', filters.verification_status);
    if (filters.onboarding_completed !== undefined) queryParams.append('onboarding_completed', filters.onboarding_completed);
    if (filters.business_type) queryParams.append('business_type', filters.business_type);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const queryString = queryParams.toString();
    const endpoint = `/manufacturers${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get all buyers
   * @param {Object} filters - Optional filters (sortBy, sortOrder, limit, offset)
   * @returns {Promise} Response data
   */
  async getAllBuyers(filters = {}) {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const queryString = queryParams.toString();
    const endpoint = `/buyers${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Admin login with username and password
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {Promise} Response data with token
   */
  async adminLogin(username, password) {
    return this.request('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  /**
   * Update manufacturer verification status (Admin only)
   * @param {string} manufacturerId - Manufacturer ID
   * @param {string} verificationStatus - New verification status ('pending', 'Accepted', 'Rejected', 'Blocked')
   * @returns {Promise} Response data
   */
  async updateManufacturerVerificationStatus(manufacturerId, verificationStatus) {
    return this.request(`/manufacturers/${manufacturerId}/verification-status`, {
      method: 'PATCH',
      body: JSON.stringify({ verification_status: verificationStatus })
    });
  }

  /**
   * Logout user (calls backend logout endpoint)
   * @param {string} [redirectPath='/'] - Path to navigate to after logout
   */
  async logout(redirectPath = '/') {
    try {
      // Determine which token to clear based on current route
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      let tokenType = 'all';
      
      if (currentPath.startsWith('/buyer-portal')) {
        tokenType = 'buyer';
      } else if (currentPath.startsWith('/manufacturer-portal')) {
        tokenType = 'manufacturer';
      } else if (currentPath.startsWith('/admin')) {
        tokenType = 'admin';
      }
      
      // Call backend logout endpoint if token exists
      if (this.getToken()) {
        await this.request('/auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear only the token for the current portal
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      if (currentPath.startsWith('/buyer-portal')) {
        this.removeToken('buyer');
      } else if (currentPath.startsWith('/manufacturer-portal')) {
        this.removeToken('manufacturer');
      } else if (currentPath.startsWith('/admin')) {
        this.removeToken('admin');
      } else {
        // For other routes, clear all
        this.clearAllAuthData();
      }
      
      if (typeof window !== 'undefined') {
        window.location.href = redirectPath;
      }
    }
  }

  // =============================================
  // REQUIREMENTS API
  // =============================================

  /**
   * Create a new requirement
   * @param {Object} requirementData - Requirement data
   * @returns {Promise} Response data
   */
  async createRequirement(requirementData) {
    return this.request('/requirements', {
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
    
    return this.request(endpoint, {
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
    return this.request(`/requirements/conversation/${conversationId}/negotiating`, {
      method: 'GET'
    });
  }

  /**
   * Get a single requirement by ID
   * @param {string} requirementId - Requirement ID
   * @returns {Promise} Response data
   */
  async getRequirement(requirementId) {
    return this.request(`/requirements/${requirementId}`, {
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
    return this.request(`/requirements/${requirementId}`, {
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
    return this.request(`/requirements/${requirementId}`, {
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
    return this.request(`/requirements/${requirementId}/responses`, {
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
    return this.request(`/requirements/${requirementId}/responses`, {
      method: 'GET'
    });
  }

  /**
   * Get a single requirement response by ID
   * @param {string} responseId - Response ID
   * @returns {Promise} Response data
   */
  async getRequirementResponse(responseId) {
    return this.request(`/requirements/responses/${responseId}`, {
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
    
    return this.request(endpoint, {
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
    return this.request(`/requirements/responses/${responseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
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
    
    return this.request(endpoint, {
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

  /**
   * Get buyer requirement statistics
   * @returns {Promise} Response data with statistics (total, accepted, pending_review, in_negotiation)
   */
  async getBuyerRequirementStatistics() {
    return this.request('/requirements/buyer/statistics', {
      method: 'GET'
    });
  }

  // =============================================
  // DESIGNS API
  // =============================================

  /**
   * Upload design image
   * @param {File} file - Image file to upload
   * @returns {Promise} Upload result with image URL and metadata
   */
  async uploadDesignImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const token = this.getToken();
    const url = `${this.baseURL}/designs/upload-image`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.handleTokenExpiration();
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(data.message || `Upload failed! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Design image upload failed:', error);
      throw error;
    }
  }

  /**
   * Create a new design
   * @param {Object} designData - Design data (title, description, category, image_url, price_per_unit, min_quantity, tags)
   * @returns {Promise} Response data
   */
  async createDesign(designData) {
    return this.request('/designs', {
      method: 'POST',
      body: JSON.stringify(designData)
    });
  }

  /**
   * Get all designs
   * @param {Object} filters - Optional filters (category, search, limit, offset)
   * @returns {Promise} Response data
   */
  async getDesigns(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const queryString = queryParams.toString();
    const endpoint = `/designs${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get AI designs for the authenticated buyer
   * @param {Object} filters - Optional filters (status, apparel_type, limit, offset)
   * @returns {Promise} Response data
   */
  async getAIDesigns(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.apparel_type) queryParams.append('apparel_type', filters.apparel_type);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const queryString = queryParams.toString();
    const endpoint = `/ai-designs${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get a single design by ID
   * @param {string} designId - Design ID
   * @returns {Promise} Response data
   */
  async getDesign(designId) {
    return this.request(`/designs/${designId}`, {
      method: 'GET'
    });
  }

  /**
   * Update a design
   * @param {string} designId - Design ID
   * @param {Object} updateData - Data to update
   * @returns {Promise} Response data
   */
  async updateDesign(designId, updateData) {
    return this.request(`/designs/${designId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  /**
   * Delete a design
   * @param {string} designId - Design ID
   * @returns {Promise} Response data
   */
  async deleteDesign(designId) {
    return this.request(`/designs/${designId}`, {
      method: 'DELETE'
    });
  }

  // =============================================
  // ORDERS API
  // =============================================

  /**
   * Create a new order
   * @param {Object} orderData - Order data (manufacturer_id, design_id, quantity, price_per_unit, total_price)
   * @returns {Promise} Response data
   */
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  /**
   * Get manufacturer's orders
   * @param {Object} filters - Optional filters (status, limit, offset, sortBy, sortOrder)
   * @returns {Promise} Response data
   */
  async getManufacturerOrders(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/orders/manufacturer${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get buyer's orders
   * @param {Object} filters - Optional filters (status, limit, offset, sortBy, sortOrder)
   * @returns {Promise} Response data
   */
  async getBuyerOrders(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/orders/buyer${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get a single order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise} Response data
   */
  async getOrder(orderId) {
    return this.request(`/orders/${orderId}`, {
      method: 'GET'
    });
  }

  /**
   * Update order status (Manufacturer only)
   * @param {string} orderId - Order ID
   * @param {string} status - New status ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')
   * @returns {Promise} Response data
   */
  async updateOrderStatus(orderId, status) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
export const getApiBaseOrigin = () => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
};
