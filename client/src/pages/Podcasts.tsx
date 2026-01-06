import { usePodcasts } from "@/hooks/use-content";
import { Link } from "wouter";
import { Loader2, Play, Headphones } from "lucide-react";

export default function Podcasts() {
  const { data: podcasts, isLoading } = usePodcasts();

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
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Headphones className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl mb-4">Golf Talks Podcast</h1>
        <p className="text-muted-foreground text-lg">
          Listen to AI-generated discussions about golf trends, course histories, and pro tips.
        </p>
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        {podcasts?.map((podcast) => (
          <Link key={podcast.id} href={`/podcasts/${podcast.slug}`}>
            <div className="group bg-white p-6 rounded-2xl border border-border hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer flex gap-6 items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-secondary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Play className="w-8 h-8 md:w-10 md:h-10 ml-1" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {podcast.title}
                  </h3>
                  <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                    EP {podcast.id}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {podcast.script.substring(0, 150)}...
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                  <span>{new Date(podcast.createdAt || "").toLocaleDateString()}</span>
                  <span>•</span>
                  <span>15 min listen</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
