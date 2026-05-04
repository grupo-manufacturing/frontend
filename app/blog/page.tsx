import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/landing/Navbar";
import Footer from "@/app/components/landing/Footer";
import blogService from "@/app/lib/services/features/BlogService.js";
import type { BlogPost } from "@/app/types/blog";

export const metadata: Metadata = {
  title: "Grupo Blog | Manufacturing, Sourcing, and AI Insights",
  description:
    "Explore practical insights on apparel manufacturing, sourcing, buyer-manufacturer collaboration, and AI-driven workflows.",
};

export const revalidate = 60;

export default async function BlogPage() {
  let loadError: string | null = null;
  let posts: BlogPost[] = [];
  try {
    posts = await blogService.loadPublishedPosts();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load blog posts.";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50/40">
      <Navbar />

      <main className="pt-24 pb-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase">
              Grupo Blog
            </p>
            <h1 className="mt-4 text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Insights For Smarter Manufacturing Decisions
            </h1>
            <p className="mt-4 max-w-3xl text-base md:text-lg text-slate-600">
              Practical guides for buyers and manufacturers building faster, more predictable, and
              high-quality supply workflows.
            </p>
          </div>

          {loadError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-800">
              {loadError}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-slate-600">No published posts yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                    ) : null}
                  </div>

                  <div className="p-6">
                    <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        {post.category || "Blog"}
                      </span>
                      <span>{post.readTime}</span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 leading-snug">{post.title}</h2>
                    {post.excerpt ? (
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{post.excerpt}</p>
                    ) : null}

                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Read More
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
