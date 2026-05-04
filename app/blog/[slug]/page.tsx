import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/landing/Navbar";
import Footer from "@/app/components/landing/Footer";
import blogService from "@/app/lib/services/features/BlogService.js";
import type { BlogPost } from "@/app/types/blog";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  let post: BlogPost | null = null;
  try {
    post = (await blogService.loadPublishedPost(slug)) as BlogPost | null;
  } catch {
    return {
      title: "Grupo Blog",
      description: "Blog post could not be loaded.",
    };
  }

  if (!post) {
    return {
      title: "Post Not Found | Grupo Blog",
      description: "Requested blog post does not exist.",
    };
  }

  return {
    title: `${post.title} | Grupo Blog`,
    description: post.excerpt || post.title,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  let post: BlogPost | null = null;
  let loadError: string | null = null;
  try {
    post = (await blogService.loadPublishedPost(slug)) as BlogPost | null;
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load blog post.";
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50/40">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-800">
            {loadError}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50/40">
      <Navbar />

      <main className="pt-24 pb-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <p className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase">
              {post.category || "Blog"}
            </p>
            <h1 className="mt-4 text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              {post.title}
            </h1>
            {post.excerpt ? (
              <p className="mt-4 text-base md:text-lg text-slate-600">{post.excerpt}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span aria-hidden="true">•</span>
              <span>{post.readTime}</span>
            </div>
          </header>

          {post.coverImage ? (
            <div className="relative mb-10 h-[320px] md:h-[460px] w-full overflow-hidden rounded-2xl border border-slate-200">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
            <div className="space-y-6 text-slate-700 leading-8">
              {post.contentParagraphs.length > 0 ? (
                post.contentParagraphs.map((paragraph, index) => (
                  <p key={`${post.id}-p-${index}`}>{paragraph}</p>
                ))
              ) : (
                <p className="text-slate-500">No body content for this post.</p>
              )}
            </div>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
