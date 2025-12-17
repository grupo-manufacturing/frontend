/**
 * Token Manager - Handles token storage and retrieval logic
 */

/**
 * Store JWT token in localStorage
 * @param {string} token - JWT token
 * @param {string} tokenType - Token type: 'buyer', 'manufacturer', or 'admin' (defaults to 'buyer' for backward compatibility)
 */
export function setToken(token, tokenType = 'buyer') {
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
export function getToken() {
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
export function removeToken(tokenType = 'all') {
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
export function clearAllAuthData() {
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

