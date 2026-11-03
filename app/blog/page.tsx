import type { Metadata } from "next";
import BlogIndex from "@/components/blog/BlogIndex";
import { getPosts } from "@/lib/api";

export const metadata: Metadata = {
  title: "The journal",
  description: "Guides to Ayurveda and the ingredients behind Mirasha: Shilajit, collagen, magnesium, vitamin B12, apple cider vinegar, moringa, rosemary and sea buckthorn.",
};

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <div className="pt-24">
      <header className="container-x pb-10 pt-14 md:pt-20">
        <p className="eyebrow">The journal</p>
        <h1 className="headline mt-3 text-5xl md:text-7xl">Wisdom, explained.</h1>
        <p className="mt-4 max-w-xl text-lg text-muted md:text-xl">
          Clear, honest guides to Ayurveda and the ingredients in every Mirasha product.
        </p>
      </header>
      <BlogIndex posts={posts} />
    </div>
  );
}
