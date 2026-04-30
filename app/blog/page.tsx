import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/landing/Navbar";
import Footer from "@/app/components/landing/Footer";
import { getAllBlogPosts } from "@/app/lib/blog";

export const metadata: Metadata = {
  title: "Grupo Blog | Manufacturing, Sourcing, and AI Insights",
  description:
    "Explore practical insights on apparel manufacturing, sourcing, buyer-manufacturer collaboration, and AI-driven workflows.",
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-52 w-full overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                </div>

                <div className="p-6">
                  <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{post.category}</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 leading-snug">{post.title}</h2>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{post.excerpt}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

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
        </section>
      </main>

      <Footer />
    </div>
  );
}
