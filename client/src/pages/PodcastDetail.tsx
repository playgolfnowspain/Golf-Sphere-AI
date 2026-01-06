import { usePodcast } from "@/hooks/use-content";
import { useRoute, Link } from "wouter";
import { Loader2, PlayCircle, ArrowLeft, Download, Share2 } from "lucide-react";

export default function PodcastDetail() {
  const [match, params] = useRoute("/podcasts/:slug");
  const { data: podcast, isLoading } = usePodcast(params?.slug || "");

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Podcast Not Found</h2>
        <Link href="/podcasts" className="text-primary hover:underline">Back to Podcasts</Link>
      </div>
    );
  }

  return (
    <div className="container-wide py-12 md:py-20">
      <Link href="/podcasts" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Episodes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
            {podcast.title}
          </h1>
          
          <div className="bg-black text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
               <PlayCircle className="w-16 h-16" />
            </div>
            <div className="flex-1 w-full space-y-4">
              <div className="h-1 bg-white/20 rounded-full w-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary rounded-full" />
              </div>
              <div className="flex justify-between text-xs text-white/60 font-mono">
                <span>05:12</span>
                <span>15:00</span>
              </div>
              <div className="flex gap-4">
                <button className="btn-primary py-2 px-6 rounded-full text-xs">
                  Play Episode
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Download className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h3>Transcript</h3>
            <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
              {podcast.script}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-secondary/30 p-6 rounded-2xl border border-border">
            <h3 className="font-bold mb-4">About this Episode</h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground mb-1">Published</dt>
                <dd className="font-medium">{new Date(podcast.createdAt || "").toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-1">Duration</dt>
                <dd className="font-medium">15 min</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-1">Host</dt>
                <dd className="font-medium">AI Golf Analyst</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
