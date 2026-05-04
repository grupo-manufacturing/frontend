'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminBlogPost, AdminBlogPostListItem } from '../types';
import { formatDate } from '../utils';
import apiService from '../../lib/apiService';
import { useToast } from '../../components/Toast';

type StatusFilter = 'all' | 'draft' | 'published';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** OS dark mode sets body `color` to light; inputs stay white — force dark text + visible placeholders */
const FORM_FIELD =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400/35 focus:border-sky-500';
const FORM_FIELD_MONO = `${FORM_FIELD} font-mono`;

function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'new-post'
  );
}

interface BlogAdminProps {
  reloadKey: number;
}

export default function BlogAdmin({ reloadKey }: BlogAdminProps) {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [posts, setPosts] = useState<AdminBlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await apiService.listAdminBlogPosts({
        status: statusFilter,
        limit: 100,
        sortBy: 'updated_at',
        sortOrder: 'desc',
      });
      if (!res.success) {
        throw new Error((res as { message?: string }).message || 'Failed to load posts');
      }
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load posts';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts, reloadKey]);

  const openCreate = () => {
    setEditorMode('create');
    setEditingId(null);
    setSlug('');
    setTitle('');
    setExcerpt('');
    setContent('');
    setCoverImageUrl('');
    setCategory('');
    setFormStatus('draft');
    setEditorOpen(true);
  };

  const openEdit = async (id: string) => {
    setRowBusyId(id);
    try {
      const res = await apiService.getAdminBlogPost(id);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load post');
      }
      const row = res.data as AdminBlogPost;
      setEditorMode('edit');
      setEditingId(id);
      setSlug(row.slug || '');
      setTitle(row.title || '');
      setExcerpt(row.excerpt ?? '');
      setContent(typeof row.content === 'string' ? row.content : '');
      setCoverImageUrl(row.cover_image_url ?? '');
      setCategory(row.category ?? '');
      setFormStatus(row.status === 'published' ? 'published' : 'draft');
      setEditorOpen(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load post');
    } finally {
      setRowBusyId(null);
    }
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    const t = title.trim();
    const s = slug.trim();
    if (!t) {
      toast.error('Title is required');
      return;
    }
    if (!s || !SLUG_RE.test(s)) {
      toast.error('Slug must be lowercase kebab-case (letters, numbers, hyphens)');
      return;
    }
    const body: Record<string, unknown> = {
      slug: s,
      title: t,
      excerpt: excerpt.trim() || null,
      content: content,
      cover_image_url: coverImageUrl.trim() || null,
      category: category.trim() || null,
      status: formStatus,
    };
    setSaving(true);
    try {
      if (editorMode === 'create') {
        const res = await apiService.createAdminBlogPost(body);
        if (!res.success) throw new Error(res.message || 'Create failed');
        toast.success(formStatus === 'published' ? 'Post published.' : 'Draft saved.');
      } else if (editingId) {
        const res = await apiService.updateAdminBlogPost(editingId, body);
        if (!res.success) throw new Error(res.message || 'Update failed');
        toast.success(formStatus === 'published' ? 'Post published.' : 'Post updated.');
      }
      closeEditor();
      await loadPosts();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const publishRow = async (id: string) => {
    setRowBusyId(id);
    try {
      const res = await apiService.updateAdminBlogPost(id, { status: 'published' });
      if (!res.success) throw new Error(res.message || 'Publish failed');
      toast.success('Post is live on the blog.');
      await loadPosts();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setRowBusyId(null);
    }
  };

  const unpublishRow = async (id: string) => {
    setRowBusyId(id);
    try {
      const res = await apiService.updateAdminBlogPost(id, { status: 'draft' });
      if (!res.success) throw new Error(res.message || 'Unpublish failed');
      toast.success('Post moved to draft (hidden from public blog).');
      await loadPosts();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unpublish failed');
    } finally {
      setRowBusyId(null);
    }
  };

  const deleteRow = async (id: string, postTitle: string) => {
    if (!window.confirm(`Delete post "${postTitle}"? This cannot be undone.`)) return;
    setRowBusyId(id);
    try {
      const res = await apiService.deleteAdminBlogPost(id);
      if (!res.success) throw new Error(res.message || 'Delete failed');
      toast.success('Post deleted.');
      await loadPosts();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setRowBusyId(null);
    }
  };

  const previewUrl = (slugValue: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/blog/${encodeURIComponent(slugValue)}` : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Blog</h1>
          <p className="text-sm text-slate-500">
            Create drafts, publish posts, and manage what visitors see on the public blog.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-lg bg-[#22a2f2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b8fd4]"
        >
          New post
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'draft', 'published'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              statusFilter === f
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <svg
            className="h-8 w-8 animate-spin text-[#22a2f2]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
            <path d="M21 3v6h-6" />
          </svg>
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
      )}

      {!loading && !loadError && posts.length === 0 && (
        <p className="text-sm text-slate-500">No posts in this filter. Create one to get started.</p>
      )}

      {!loading && !loadError && posts.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.title}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <code className="text-xs">{p.slug}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(p.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {p.status === 'published' && (
                        <a
                          href={previewUrl(p.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          View
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={rowBusyId === p.id}
                        onClick={() => void openEdit(p.id)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      {p.status === 'draft' ? (
                        <button
                          type="button"
                          disabled={rowBusyId === p.id}
                          onClick={() => void publishRow(p.id)}
                          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={rowBusyId === p.id}
                          onClick={() => void unpublishRow(p.id)}
                          className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={rowBusyId === p.id}
                        onClick={() => void deleteRow(p.id, p.title)}
                        className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editorMode === 'create' ? 'New post' : 'Edit post'}
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {
                    if (editorMode === 'create' && !slug.trim() && title.trim()) {
                      setSlug(slugifyTitle(title));
                    }
                  }}
                  className={FORM_FIELD}
                  placeholder="Post title"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Slug (URL)</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className={FORM_FIELD_MONO}
                  placeholder="my-post-slug"
                />
                <p className="mt-1 text-xs text-slate-600">Lowercase kebab-case. Shown at /blog/your-slug</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className={FORM_FIELD}
                  placeholder="Short summary for cards and SEO"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Body</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className={FORM_FIELD_MONO}
                  placeholder="Post body. Use blank lines between paragraphs."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Cover image URL
                  </label>
                  <input
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className={FORM_FIELD}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Category</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={FORM_FIELD}
                    placeholder="e.g. Sourcing"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'draft' | 'published')}
                  className={`${FORM_FIELD} sm:max-w-xs`}
                >
                  <option value="draft">Draft (not on public blog)</option>
                  <option value="published">Published (visible on public blog)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="rounded-lg bg-[#22a2f2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b8fd4] disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}