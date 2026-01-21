import { useArticle } from "@/hooks/use-content";
import { useRoute } from "wouter";
import ReactMarkdown from "react-markdown";
import { Loader2, Calendar, User, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ArticleDetail() {
  const [match, params] = useRoute("/articles/:slug");
  const { data: article, isLoading } = useArticle(params?.slug || "");

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Article Not Found</h2>
        <Link href="/articles" className="text-primary hover:underline">Back to Articles</Link>
      </div>
    );
  }

  return (
    <article className="pb-20">
      {/* Header with Image */}
      <div className="relative h-[60vh] min-h-[400px]">
        <img 
          src={article.imageUrl || "https://images.unsplash.com/photo-1560170433-10a9c1483a99?q=80&w=2068&auto=format&fit=crop"} 
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
          <div className="container-wide max-w-4xl mx-auto text-white">
            <Link href="/articles" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Articles
            </Link>
            <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight mb-6">
              {article.title}
            </h1>
            <div className="flex items-center gap-6 text-sm md:text-base text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(article.createdAt || "").toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>By GolfSphere</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-wide max-w-3xl mx-auto py-12 md:py-20">
        <div className="prose prose-lg prose-headings:font-display prose-headings:font-bold prose-green max-w-none">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border">
          <h3 className="text-xl font-bold mb-4">Share this article</h3>
          <div className="flex gap-4">
            {/* Social Share Mockups */}
            <button className="px-4 py-2 rounded-full border border-border text-sm hover:bg-secondary transition-colors">Twitter</button>
            <button className="px-4 py-2 rounded-full border border-border text-sm hover:bg-secondary transition-colors">Facebook</button>
            <button className="px-4 py-2 rounded-full border border-border text-sm hover:bg-secondary transition-colors">LinkedIn</button>
          </div>
        </div>
      </div>
    </article>
  );
}
