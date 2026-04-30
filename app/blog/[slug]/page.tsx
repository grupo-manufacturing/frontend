import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/landing/Navbar";
import Footer from "@/app/components/landing/Footer";
import { getAllBlogPosts, getBlogPostBySlug } from "@/app/lib/blog";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | Grupo Blog",
      description: "Requested blog post does not exist.",
    };
  }

  return {
    title: `${post.title} | Grupo Blog`,
    description: post.excerpt,
  };
}

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

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
              {post.category}
            </p>
            <h1 className="mt-4 text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 text-base md:text-lg text-slate-600">{post.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>{post.author}</span>
              <span aria-hidden="true">•</span>
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

          <div className="relative mb-10 h-[320px] md:h-[460px] w-full overflow-hidden rounded-2xl border border-slate-200">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
            <div className="space-y-6 text-slate-700 leading-8">
              {post.content.map((paragraph, index) => (
                <p key={`${post.id}-paragraph-${index}`}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-10 border-t border-slate-200 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tags</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
