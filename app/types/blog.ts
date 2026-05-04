/** Blog post shape used by `/blog` UI (mapped from API). */
export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentParagraphs: string[];
  category: string | null;
  coverImage: string | null;
  publishedAt: string;
  readTime: string;
};
