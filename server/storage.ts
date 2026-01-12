import { type Article, type InsertArticle, type Podcast, type InsertPodcast, type Booking, type InsertBooking, type NewsletterSubscriber, type InsertNewsletterSubscriber } from "@shared/schema";

export interface IStorage {
  // Articles
  getArticles(): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;

  // Podcasts
  getPodcasts(): Promise<Podcast[]>;
  getPodcastBySlug(slug: string): Promise<Podcast | undefined>;
  createPodcast(podcast: InsertPodcast): Promise<Podcast>;

  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;

  // Newsletter
  subscribeToNewsletter(email: string): Promise<NewsletterSubscriber>;
  getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined>;
}

// Mock storage for development when database is not available
class MockStorage implements IStorage {
  private articles: Article[] = [
    {
      id: 1,
      title: "Top 5 Golf Courses in Costa del Sol",
      slug: "top-5-costa-del-sol",
      content: "Costa del Sol is a golfer's paradise. Here are the top 5 courses you must play:\n\n1. **Valderrama** - One of Europe's most prestigious courses, host to the 1997 Ryder Cup.\n2. **Sotogrande** - A beautiful Robert Trent Jones Sr. design with stunning views.\n3. **Finca Cortesin** - Luxury resort course with impeccable conditions.\n4. **La Reserva** - Modern design with spectacular mountain and sea views.\n5. **San Roque** - Two championship courses in a stunning setting.\n\nEach course offers unique challenges and breathtaking scenery. Whether you're a beginner or a pro, these courses will provide an unforgettable golfing experience.",
      summary: "Discover the best courses in the south of Spain.",
      imageUrl: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1000",
      createdAt: new Date("2024-01-15") as Date | null,
    },
    {
      id: 2,
      title: "How to Improve Your Swing for Spanish Courses",
      slug: "improve-swing-spanish-courses",
      content: "Spanish courses can present unique challenges, especially with wind and varying terrain. Here are some tips:\n\n**Dealing with Wind:**\n- Keep your ball flight lower by adjusting your stance\n- Use more club than usual in headwinds\n- Aim for the center of greens when windy\n\n**Course Management:**\n- Study the course layout before playing\n- Pay attention to elevation changes\n- Adjust your strategy based on weather conditions\n\n**Practice Tips:**\n- Focus on consistent ball striking\n- Practice chipping on different lies\n- Work on putting speed control",
      summary: "Tips for playing in the unique conditions of Spain.",
      imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=1000",
      createdAt: new Date("2024-01-20") as Date | null,
    },
    {
      id: 3,
      title: "Best Time to Play Golf in Spain",
      slug: "best-time-to-play-golf-in-spain",
      content: "Spain offers year-round golf, but timing can make all the difference:\n\n**Spring (March-May):** Perfect weather, moderate temperatures, and blooming landscapes.\n**Summer (June-August):** Hot but great for early morning or evening rounds.\n**Autumn (September-November):** Ideal conditions, less crowded, pleasant weather.\n**Winter (December-February):** Mild in the south, perfect for escaping cold climates.\n\nThe Costa del Sol region is particularly popular in winter when northern European golfers seek warmer weather.",
      summary: "Plan your golf trip to Spain with perfect timing.",
      imageUrl: "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?auto=format&fit=crop&q=80&w=1000",
      createdAt: new Date("2024-01-25") as Date | null,
    },
  ];

  private podcasts: Podcast[] = [
    {
      id: 1,
      title: "Episode 1: Golfing in Andalusia",
      slug: "episode-1-andalusia",
      script: "Host: Welcome to Golf Talk Spain! Today we discuss the beautiful region of Andalusia, home to some of the world's most stunning golf courses.\n\nGuest: Andalusia is truly special. The combination of mountains, sea, and perfect weather creates an ideal golfing environment.\n\nHost: What would you recommend for first-time visitors?\n\nGuest: I'd start with the Costa del Sol region. You have Valderrama, Sotogrande, and many other championship courses within easy reach. The infrastructure is excellent, and you can play multiple courses in a single trip.\n\nHost: And the best time to visit?\n\nGuest: Ideally, you want to book in spring or autumn when the weather is perfect - not too hot, not too cold. But honestly, even in winter, the weather is much better than most of Europe!",
      audioUrl: null,
      createdAt: new Date("2024-01-10") as Date | null,
    },
    {
      id: 2,
      title: "Episode 2: Course Design Philosophy in Spain",
      slug: "episode-2-course-design",
      script: "Host: Today we're exploring what makes Spanish golf courses unique in their design.\n\nGuest: Spanish courses often blend seamlessly with the natural landscape. You'll see designers working around ancient olive trees, incorporating natural water features, and using the terrain to create challenging but fair holes.\n\nHost: Are there any signature features?\n\nGuest: Yes! You'll notice a lot of courses use elevation changes creatively. Many also have views of the Mediterranean, which adds to the experience. The use of local materials and vegetation also helps courses feel authentic to their location.",
      audioUrl: null,
      createdAt: new Date("2024-01-17") as Date | null,
    },
    {
      id: 3,
      title: "Episode 3: Booking Your Dream Golf Vacation",
      slug: "episode-3-booking-vacation",
      script: "Host: Planning a golf trip to Spain? Let's talk about how to make it perfect.\n\nGuest: First, decide on your region. Costa del Sol is popular, but don't overlook areas like Barcelona, Mallorca, or the Canary Islands.\n\nHost: What about booking tee times?\n\nGuest: Book in advance, especially during peak season. Many courses offer packages that include accommodation and multiple rounds. Also, consider hiring a local caddie - they know the courses intimately and can really improve your experience.\n\nHost: Any insider tips?\n\nGuest: Yes! Many courses offer twilight rates. Also, Spanish courses often have excellent clubhouse restaurants - make time to enjoy the local cuisine after your round!",
      audioUrl: null,
      createdAt: new Date("2024-01-24") as Date | null,
    },
  ];

  private bookings: Booking[] = [];
  private nextBookingId = 1;

  async getArticles(): Promise<Article[]> {
    return [...this.articles].sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    return this.articles.find(a => a.slug === slug);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const article: Article = {
      id: this.articles.length + 1,
      ...insertArticle,
      summary: insertArticle.summary ?? null,
      imageUrl: insertArticle.imageUrl ?? null,
      createdAt: new Date(),
    };
    this.articles.push(article);
    return article;
  }

  async getPodcasts(): Promise<Podcast[]> {
    return [...this.podcasts].sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getPodcastBySlug(slug: string): Promise<Podcast | undefined> {
    return this.podcasts.find(p => p.slug === slug);
  }

  async createPodcast(insertPodcast: InsertPodcast): Promise<Podcast> {
    const podcast: Podcast = {
      id: this.podcasts.length + 1,
      ...insertPodcast,
      audioUrl: insertPodcast.audioUrl ?? null,
      createdAt: new Date(),
    };
    this.podcasts.push(podcast);
    return podcast;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      id: this.nextBookingId++,
      ...insertBooking,
      status: "confirmed",
      createdAt: new Date(),
    };
    this.bookings.push(booking);
    return booking;
  }

  private subscribers: NewsletterSubscriber[] = [];

  async subscribeToNewsletter(email: string): Promise<NewsletterSubscriber> {
    // Check if already subscribed
    const existing = this.subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (existing && existing.subscribed) {
      throw new Error("Email already subscribed");
    }
    
    if (existing) {
      // Reactivate subscription
      existing.subscribed = true;
      return existing;
    }

    const subscriber: NewsletterSubscriber = {
      id: this.subscribers.length + 1,
      email: email.toLowerCase(),
      subscribed: true,
      createdAt: new Date(),
    };
    this.subscribers.push(subscriber);
    return subscriber;
  }

  async getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    return this.subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
  }
}

// Try to use database storage, fall back to mock if database is not available
// Initialize immediately with MockStorage to avoid undefined access
let storage: IStorage = new MockStorage();

async function initializeStorage(): Promise<IStorage> {
  if (process.env.DATABASE_URL) {
    try {
      // Import database dependencies
      const { db } = await import("./db");
      const { articles, podcasts, bookings, newsletterSubscribers } = await import("@shared/schema");
      const { eq, desc } = await import("drizzle-orm");

      if (!db) {
        throw new Error("Database not initialized despite DATABASE_URL being set.");
      }

      // Store db reference for type narrowing
      const database = db;

      class DatabaseStorage implements IStorage {
        async getArticles(): Promise<Article[]> {
          return await database.select().from(articles).orderBy(desc(articles.createdAt));
        }

        async getArticleBySlug(slug: string): Promise<Article | undefined> {
          const [article] = await database.select().from(articles).where(eq(articles.slug, slug));
          return article;
        }

        async createArticle(insertArticle: InsertArticle): Promise<Article> {
          const [article] = await database.insert(articles).values(insertArticle).returning();
          return article;
        }

        async getPodcasts(): Promise<Podcast[]> {
          return await database.select().from(podcasts).orderBy(desc(podcasts.createdAt));
        }

        async getPodcastBySlug(slug: string): Promise<Podcast | undefined> {
          const [podcast] = await database.select().from(podcasts).where(eq(podcasts.slug, slug));
          return podcast;
        }

        async createPodcast(insertPodcast: InsertPodcast): Promise<Podcast> {
          const [podcast] = await database.insert(podcasts).values(insertPodcast).returning();
          return podcast;
        }

        async createBooking(insertBooking: InsertBooking): Promise<Booking> {
          const [booking] = await database.insert(bookings).values(insertBooking).returning();
          return booking;
        }

        async subscribeToNewsletter(email: string): Promise<NewsletterSubscriber> {
          // Check if already subscribed
          const existing = await this.getSubscriberByEmail(email);
          if (existing && existing.subscribed) {
            throw new Error("Email already subscribed");
          }

          if (existing) {
            // Reactivate subscription
            const [updated] = await database
              .update(newsletterSubscribers)
              .set({ subscribed: true })
              .where(eq(newsletterSubscribers.email, email.toLowerCase()))
              .returning();
            return updated;
          }

          const [subscriber] = await database
            .insert(newsletterSubscribers)
            .values({ email: email.toLowerCase(), subscribed: true })
            .returning();
          return subscriber;
        }

        async getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
          const [subscriber] = await database
            .select()
            .from(newsletterSubscribers)
            .where(eq(newsletterSubscribers.email, email.toLowerCase()));
          return subscriber;
        }
      }

      console.log("[storage] Using database storage");
      return new DatabaseStorage();
    } catch (error) {
      // Database connection failed, use mock storage
      console.log("[storage] Database connection failed, using mock storage:", error instanceof Error ? error.message : error);
      return new MockStorage();
    }
  } else {
    // No DATABASE_URL, use mock storage
    console.log("[storage] No DATABASE_URL set, using mock storage for development");
    return new MockStorage();
  }
}

// Initialize storage asynchronously and update when ready
// Storage is already initialized with MockStorage above, so it's safe to use immediately
initializeStorage()
  .then((initializedStorage) => {
    storage = initializedStorage;
  })
  .catch((err) => {
    console.error("[storage] Failed to initialize storage:", err);
    // Keep MockStorage as fallback
  });

export { storage };
