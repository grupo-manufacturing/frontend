/**
 * Chat Service - Chat & messaging functionality
 */
import apiClient from '../core/ApiClient.js';
import { getToken } from '../utils/tokenManager.js';

class ChatService {
  async listConversations({ search, limit = 50, cursor, offset } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', String(limit));
    if (cursor) params.append('cursor', cursor);
    if (offset !== undefined) params.append('offset', String(offset));
    const qs = params.toString();
    return apiClient.request(`/chat/conversations${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }

  async ensureConversation(buyerId, manufacturerId) {
    return apiClient.request('/chat/conversations', {
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
    return apiClient.request(`/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`, { method: 'GET' });
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
    return apiClient.request(`/chat/conversations/${conversationId}/messages/requirement/${requirementId}${qs ? `?${qs}` : ''}`, { 
      method: 'GET' 
    });
  }

  /**
   * Get messages for a specific AI design in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} aiDesignId - AI Design ID
   * @param {Object} options - Query options (before, limit)
   * @returns {Promise} Response data with messages
   */
  async getMessagesForAIDesign(conversationId, aiDesignId, { before, limit = 200 } = {}) {
    const params = new URLSearchParams();
    if (before) params.append('before', before);
    if (limit) params.append('limit', String(limit));
    const qs = params.toString();
    return apiClient.request(`/chat/conversations/${conversationId}/messages/ai-design/${aiDesignId}${qs ? `?${qs}` : ''}`, { 
      method: 'GET' 
    });
  }

  async sendMessage(conversationId, { body, clientTempId, attachments, requirementId, aiDesignId }) {
    return apiClient.request(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, clientTempId, attachments, requirementId, aiDesignId })
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

    const token = getToken();
    const url = `${apiClient.getBaseURL()}/upload/chat-file`;

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
          apiClient.handleTokenExpiration();
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

    const token = getToken();
    const url = `${apiClient.getBaseURL()}/upload/multiple`;

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
          apiClient.handleTokenExpiration();
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
    return apiClient.request(`/chat/conversations/${conversationId}/read`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

// Create singleton instance
const chatService = new ChatService();

export default chatService;

