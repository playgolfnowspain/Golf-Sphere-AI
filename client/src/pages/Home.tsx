import { Link } from "wouter";
import { useArticles, usePodcasts } from "@/hooks/use-content";
import { Calendar, Play, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { data: podcasts, isLoading: podcastsLoading } = usePodcasts();

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Descriptive alt text for searchability */}
        {/* luxury golf course spain sunset */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop" 
            alt="Beautiful golf course in Spain" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />
        </div>

        <div className="container-wide relative z-10 text-center text-white space-y-8 max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-sm font-medium mb-6">
              The Premier Golf Destination
            </span>
            <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6">
              Your Ultimate Guide to <br/>
              <span className="text-primary-foreground bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-200">
                Golf in Spain
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed font-light">
              Experience world-class courses, book tee times instantly, and discover hidden gems through our AI-curated guides.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/book">
              <button className="h-14 px-8 rounded-full bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:-translate-y-1">
                Book a Tee Time
              </button>
            </Link>
            <Link href="/articles">
              <button className="h-14 px-8 rounded-full bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold text-lg hover:bg-white/20 transition-all hover:-translate-y-1">
                Explore Courses
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="container-wide">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-primary font-semibold tracking-wide uppercase text-sm">Read</span>
            <h2 className="text-4xl mt-2">Latest Insights</h2>
          </div>
          <Link href="/articles" className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
            View all articles <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {articlesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-gray-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles?.slice(0, 3).map((article) => (
              <Link key={article.id} href={`/articles/${article.slug}`} className="group cursor-pointer">
                <article className="h-full flex flex-col">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 relative shadow-lg">
                    {/* Placeholder image if none provided */}
                    <img 
                      src={article.imageUrl || "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop"} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground font-medium">News</span>
                      <span>{new Date(article.createdAt || "").toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-3 mb-4 flex-1">
                      {article.summary}
                    </p>
                    <span className="text-primary font-medium flex items-center gap-2">
                      Read Article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Booking Promo */}
      <section className="bg-secondary/30 py-20 border-y border-border/50">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 space-y-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Star className="w-4 h-4 fill-primary" /> Powered by Greenfee365
              </span>
              <h2 className="text-4xl md:text-5xl font-display leading-tight">
                Seamless Tee Time <br/>Bookings across Spain
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Connect directly with over 500 golf courses. Real-time availability, instant confirmation, and the best rates guaranteed. No booking fees, ever.
              </p>
              <ul className="space-y-3">
                {['Instant Confirmation', 'No Booking Fees', 'Best Price Guarantee', '24/7 Support'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-foreground font-medium">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link href="/book">
                  <button className="btn-primary">
                    Start Booking
                  </button>
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative">
              {/* golf course map spain tablet mockup */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white rotate-2 transform hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1628624747186-a941c476b7ef?q=80&w=2070&auto=format&fit=crop" 
                  alt="Golf booking app interface" 
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute top-10 -right-10 w-full h-full bg-primary/5 rounded-3xl -z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Latest Podcasts */}
      <section className="container-wide">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-primary font-semibold tracking-wide uppercase text-sm">Listen</span>
            <h2 className="text-4xl mt-2">Golf Talks Podcast</h2>
          </div>
          <Link href="/podcasts" className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
            Listen to all episodes <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {podcastsLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {podcasts?.slice(0, 4).map((podcast) => (
              <Link key={podcast.id} href={`/podcasts/${podcast.slug}`}>
                <div className="group bg-white border border-border p-6 rounded-2xl flex items-center gap-6 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Play className="w-6 h-6 ml-1" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{podcast.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Episode {podcast.id}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>{new Date(podcast.createdAt || "").toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
