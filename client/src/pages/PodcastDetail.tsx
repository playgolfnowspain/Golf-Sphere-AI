import { usePodcast } from "@/hooks/use-content";
import { useRoute, Link } from "wouter";
import { Loader2, ArrowLeft, Volume2 } from "lucide-react";
import { useRef, useState } from "react";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PodcastDetail() {
  const [match, params] = useRoute("/podcasts/:slug");
  const { data: podcast, isLoading } = usePodcast(params?.slug || "");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

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
          
          {podcast.audioUrl ? (
            <div className="bg-black text-white p-8 rounded-3xl shadow-xl">
              <audio
                ref={audioRef}
                src={podcast.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                preload="metadata"
              />
              <div className="flex flex-col md:flex-row items-center gap-8">
                <button
                  onClick={togglePlay}
                  className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shrink-0 hover:bg-primary/90 transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 w-full space-y-3">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                  />
                  <div className="flex justify-between text-xs text-white/60 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary/50 p-8 rounded-3xl flex items-center gap-4">
              <Volume2 className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Audio Coming Soon</p>
                <p className="text-sm text-muted-foreground">Read the transcript below</p>
              </div>
            </div>
          )}

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
                <dd className="font-medium">{duration > 0 ? formatTime(duration) : "—"}</dd>
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
