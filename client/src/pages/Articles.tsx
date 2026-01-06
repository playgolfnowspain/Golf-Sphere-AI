import { useArticles } from "@/hooks/use-content";
import { Link } from "wouter";
import { ArrowRight, Loader2 } from "lucide-react";

export default function Articles() {
  const { data: articles, isLoading } = useArticles();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container-wide py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl mb-4">Golf Insights & Guides</h1>
        <p className="text-muted-foreground text-lg">
          Expert advice, course reviews, and travel tips for your next Spanish golf adventure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles?.map((article) => (
          <Link key={article.id} href={`/articles/${article.slug}`} className="group cursor-pointer">
            <article className="h-full flex flex-col bg-white rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300">
              <div className="aspect-[16/9] overflow-hidden relative">
                <img 
                  src={article.imageUrl || "https://images.unsplash.com/photo-1593111774240-d529f12db4bb?q=80&w=2076&auto=format&fit=crop"} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-xs font-semibold tracking-wider text-primary uppercase mb-3">
                  Guide
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
                  {article.summary}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {new Date(article.createdAt || "").toLocaleDateString()}
                  </span>
                  <span className="text-sm font-medium text-foreground flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read More <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
