export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string[];
  author: string;
  category: string;
  tags: string[];
  coverImage: string;
  publishedAt: string;
  readTime: string;
};

export const blogPosts: BlogPost[] = [
  {
    id: "post-1",
    title: "How To Choose Right Fabric For Bulk Apparel Orders",
    slug: "choose-right-fabric-for-bulk-apparel-orders",
    excerpt:
      "Fabric choice directly impacts comfort, durability, and final cost. This guide breaks down practical checkpoints for wholesale apparel sourcing.",
    content: [
      "Fabric selection decides product quality before stitching even starts. For bulk apparel, wrong fabric can increase returns, delay dispatch, and reduce repeat orders.",
      "Start with end-use context. Sportswear usually needs moisture management and stretch. Casual basics prioritize comfort and wash resistance. Uniforms require color stability and high tear strength.",
      "Always compare GSM ranges against use case. Lightweight fabric feels breathable, but may not hold shape for certain silhouettes. Heavyweight options improve durability but increase shipping and production cost.",
      "Before finalizing, request lab dips and physical swatches from manufacturer. Run at least one wash test and one stretch/recovery check. These low-cost checks prevent expensive production mistakes.",
      "Build fabric decision sheet per style with composition, GSM tolerance, finish details, shrinkage range, and care instructions. This creates alignment between buyer, merchandiser, and factory teams.",
    ],
    author: "Grupo Sourcing Team",
    category: "Sourcing",
    tags: ["Fabric", "Bulk Orders", "Quality"],
    coverImage:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-04-20",
    readTime: "6 min read",
  },
  {
    id: "post-2",
    title: "5 Ways AI Reduces Manufacturing Delays",
    slug: "five-ways-ai-reduces-manufacturing-delays",
    excerpt:
      "From planning to dispatch, AI removes common delay points in apparel production pipelines. See practical wins teams can adopt quickly.",
    content: [
      "Manufacturing delays rarely come from one issue. Usually, delays happen because updates are fragmented across sourcing, production, QA, and logistics.",
      "AI can detect risk early by tracking historical lead times against current workflow status. If a pattern shows delay probability rising, teams can react before SLA impact.",
      "Automated communication summaries help stakeholders stay aligned without waiting for manual reports. This reduces lag in approvals and purchase order confirmations.",
      "On quality side, AI-assisted checks can flag recurring defect patterns by line, machine, or material lot. Teams fix root causes faster and reduce rework cycles.",
      "Finally, AI demand forecasting helps factories plan capacity better. Better planning means fewer rush jobs, fewer bottlenecks, and more predictable dispatch dates.",
    ],
    author: "Grupo Product Team",
    category: "AI",
    tags: ["AI", "Operations", "Manufacturing"],
    coverImage:
      "https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?q=80&w=996&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    publishedAt: "2026-04-14",
    readTime: "5 min read",
  },
  {
    id: "post-3",
    title: "Buyer-Manufacturer Collaboration Checklist",
    slug: "buyer-manufacturer-collaboration-checklist",
    excerpt:
      "Clear handoff points between buyer and manufacturer improve speed, quality, and trust. Use this checklist to standardize collaboration.",
    content: [
      "Smooth buyer-manufacturer collaboration is process, not luck. High-performing teams set clear checkpoints before production kickoff.",
      "Kickoff stage should lock technical package, size chart, color standards, and tolerance rules. Ambiguity here causes repeated revisions later.",
      "Communication cadence matters. Weekly status checkpoints with consistent format reduce confusion. Use one source of truth for sampling, approvals, and PO updates.",
      "Quality ownership should be shared. Define when inline checks happen, who signs off, and what happens when defects exceed threshold.",
      "Post-dispatch, run short retrospective for each order cycle. Teams that document lessons improve margin and reliability over time.",
    ],
    author: "Grupo Operations",
    category: "Collaboration",
    tags: ["Buyers", "Manufacturers", "Workflow"],
    coverImage:
      "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-04-08",
    readTime: "4 min read",
  },
];

export const getAllBlogPosts = (): BlogPost[] => {
  return [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
};

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find((post) => post.slug === slug);
};
