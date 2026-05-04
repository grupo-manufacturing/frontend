/**
 * Blog Service — public published posts (no auth)
 */
import apiClient from '../core/ApiClient.js';

const POST_NOT_FOUND = 'Post not found';

function splitContent(content) {
  const trimmed = String(content || '').trim();
  if (!trimmed) return [];
  const blocks = trimmed
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (blocks.length > 0) return blocks;
  return [trimmed];
}

function readTimeFromWords(text) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function publishedDate(row) {
  return row.published_at || row.created_at || new Date().toISOString();
}

function mapListRow(row) {
  const excerpt = row.excerpt ?? null;
  const title = row.title ?? '';
  return {
    id: row.id,
    slug: row.slug,
    title,
    excerpt,
    category: row.category ?? null,
    coverImage: row.cover_image_url ?? null,
    publishedAt: publishedDate(row),
    readTime: readTimeFromWords(`${title} ${excerpt || ''}`.trim() || title),
    contentParagraphs: [],
  };
}

function mapDetailRow(row) {
  const content = typeof row.content === 'string' ? row.content : '';
  const base = mapListRow(row);
  return {
    ...base,
    readTime: readTimeFromWords(content || `${base.title} ${base.excerpt || ''}`),
    contentParagraphs: splitContent(content),
  };
}

class BlogService {
  /**
   * Raw API envelope (list).
   * @param {Object} [filters]
   * @returns {Promise<{ success: boolean, data?: unknown[], count?: number, message?: string }>}
   */
  async getPublishedPosts(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.limit != null) queryParams.append('limit', String(filters.limit));
    if (filters.offset != null) queryParams.append('offset', String(filters.offset));
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/blog/posts${queryString ? `?${queryString}` : ''}`;

    return apiClient.request(endpoint, {
      method: 'GET',
      next: { revalidate: 60 },
    });
  }

  /**
   * Raw API envelope (single) or null if not found.
   * @param {string} slug
   * @returns {Promise<{ success: boolean, data?: unknown, message?: string } | null>}
   */
  async getPublishedPostBySlug(slug) {
    try {
      return await apiClient.request(`/blog/posts/${encodeURIComponent(slug)}`, {
        method: 'GET',
        next: { revalidate: 60 },
      });
    } catch (e) {
      if (e instanceof Error && e.message === POST_NOT_FOUND) {
        return null;
      }
      throw e;
    }
  }

  /**
   * List posts mapped for blog UI.
   * @param {Object} [filters] merged with default limit 100
   * @returns {Promise<object[]>}
   */
  async loadPublishedPosts(filters = {}) {
    const json = await this.getPublishedPosts({ limit: 100, ...filters });
    if (!json.success) {
      throw new Error(json.message || 'Blog list failed');
    }
    const rows = Array.isArray(json.data) ? json.data : [];
    return rows.map(mapListRow);
  }

  /**
   * Single post mapped for blog UI.
   * @param {string} slug
   * @returns {Promise<object | null>}
   */
  async loadPublishedPost(slug) {
    const json = await this.getPublishedPostBySlug(slug);
    if (json === null) return null;
    if (!json.success) {
      throw new Error(json.message || 'Blog post failed');
    }
    const row = json.data;
    if (row == null || typeof row !== 'object') return null;
    return mapDetailRow(row);
  }

  /**
   * Admin: list posts (requires admin JWT).
   * @param {Object} [filters]
   * @param {'draft'|'published'|'all'} [filters.status]
   * @param {number} [filters.limit]
   * @param {number} [filters.offset]
   * @param {string} [filters.sortBy]
   * @param {string} [filters.sortOrder]
   */
  async listAdminBlogPosts(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.limit != null) queryParams.append('limit', String(filters.limit));
    if (filters.offset != null) queryParams.append('offset', String(filters.offset));
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/blog/admin/posts${queryString ? `?${queryString}` : ''}`;
    return apiClient.request(endpoint, { method: 'GET' });
  }

  /** @param {string} id */
  async getAdminBlogPost(id) {
    return apiClient.request(`/blog/admin/posts/${encodeURIComponent(id)}`, { method: 'GET' });
  }

  /** @param {Record<string, unknown>} body */
  async createAdminBlogPost(body) {
    return apiClient.request('/blog/admin/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /** @param {string} id @param {Record<string, unknown>} body */
  async updateAdminBlogPost(id, body) {
    return apiClient.request(`/blog/admin/posts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /** @param {string} id */
  async deleteAdminBlogPost(id) {
    return apiClient.request(`/blog/admin/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}

export default new BlogService();
