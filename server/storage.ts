import { type Article, type InsertArticle, type Podcast, type InsertPodcast, type Booking, type InsertBooking, type NewsletterSubscriber, type InsertNewsletterSubscriber } from "@shared/schema";

// Helper function to normalize email addresses
function normalizeEmail(email: string): string {
  return email.toLowerCase();
}

export interface IStorage {
  // Articles
  getArticles(): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  deleteArticle(id: number): Promise<boolean>;
  updateArticle(id: number, data: Partial<InsertArticle>): Promise<Article | undefined>;

  // Podcasts
  getPodcasts(): Promise<Podcast[]>;
  getPodcastBySlug(slug: string): Promise<Podcast | undefined>;
  createPodcast(podcast: InsertPodcast): Promise<Podcast>;

  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;

  // Newsletter
  subscribeToNewsletter(email: string): Promise<NewsletterSubscriber>;
  getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined>;
  getAllSubscribers(): Promise<NewsletterSubscriber[]>;
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
    {
      id: 4,
      title: "Spanish Golf Courses & Global Competitions: A 5-Minute Guide",
      slug: "spanish-golf-courses-global-competitions",
      content:
        "# Spanish Golf Courses & Global Competitions: A 5-Minute Guide\n\nSpain is one of Europe’s most reliable golf destinations: sunshine, great infrastructure, and a wide mix of classic championship layouts and resort-style courses. But the sport doesn’t stop at Spain’s borders—global competitions shape the seasons, the storylines, and the dream courses golfers want to play. Here’s a concise guide to Spain’s standout regions, what makes Spanish golf special, and a quick tour of the competitions that define the worldwide calendar.\n\n## Why Spain is a Golf Powerhouse\n\nSpain offers year-round play in many regions, easy access from major European hubs, and a culture that treats golf as part of the travel experience. Many courses are designed to showcase dramatic views—sea, mountains, and olive groves—while remaining playable for visitors.\n\n### The Key Spanish Golf Regions\n\n**Costa del Sol (Andalusia)**\nOften called the “Costa del Golf,” this region is famous for marquee courses and serious pedigree. Think Valderrama, Sotogrande, and Finca Cortesin—polished facilities, iconic holes, and immaculate conditioning. It’s the classic choice for a golf-focused holiday.\n\n**Costa Blanca (Alicante & Murcia)**\nGreat value meets variety. You’ll find resort-style courses with forgiving fairways alongside tighter, strategic layouts. The weather stays mild into late autumn and early spring, making it a strong shoulder‑season option.\n\n**Catalonia (Barcelona & Girona)**\nDesign-forward courses, excellent food, and easy city access. The area blends coastal layouts with inland, pine‑lined courses. Ideal for golfers who want a city‑plus‑golf itinerary.\n\n**Madrid & Central Spain**\nA short drive from the capital brings you to high‑quality clubs that feel more local and less tourist‑heavy. Summers are hot, but spring and autumn are excellent.\n\n**Balearic Islands (Mallorca, Ibiza)**\nMallorca is the standout for golf with scenic courses and high-end resorts. Ibiza has fewer courses but offers a unique lifestyle add‑on for a leisure‑heavy trip.\n\n**Canary Islands (Tenerife, Gran Canaria)**\nWhen winter hits the north of Europe, the Canaries stay green and playable. Expect volcanic terrain, coastal winds, and a dramatic landscape.\n\n## What Makes Spanish Courses Special\n\n- **Strategic variety:** Many layouts blend resort playability with tournament‑style challenges.\n- **Scenic elevation changes:** Hillside courses offer beautiful, memorable holes.\n- **Practice facilities:** Spain’s top clubs invest heavily in ranges and short‑game areas.\n- **Clubhouse culture:** Great dining and social spaces are the norm—perfect for post‑round tapas.\n\n## When to Go\n\nThe best windows are **March–May** and **September–November**, with comfortable temperatures and great course conditions. Summers can be hot, so early‑morning tee times are ideal. Winter golf in the south remains a major draw for northern Europeans.\n\n## Golf Competitions Around the World\n\nIf Spain is where many golfers want to play, global competitions are what keep the game’s momentum going year‑round. Here’s a quick, practical overview of the main events and tours that shape the calendar.\n\n### The Majors (Men)\n- **The Masters (Augusta National)** – The most iconic venue in golf.\n- **PGA Championship** – A deep field with modern championship setups.\n- **U.S. Open** – Known for demanding conditions.\n- **The Open Championship** – Links golf and historic tradition.\n\n### The Majors (Women)\n- **Chevron Championship**\n- **U.S. Women’s Open**\n- **Women’s PGA Championship**\n- **The Evian Championship**\n- **AIG Women’s Open**\n\n### International Team Events\n- **Ryder Cup** – Europe vs. USA, the ultimate team showdown.\n- **Solheim Cup** – Women’s equivalent, fiercely competitive.\n- **Presidents Cup** – USA vs. International team (excluding Europe).\n\n### Global Tours to Watch\n- **PGA Tour** – USA’s flagship tour, featuring the deepest fields.\n- **DP World Tour** – Strong European circuit with global stops.\n- **LPGA Tour** – World’s top women’s tour, truly international.\n- **Asian Tour & Sunshine Tour** – Great for discovering rising talent.\n\nThese tours influence where golfers travel. A venue hosting a major or a Ryder Cup often becomes a bucket‑list course for years afterwards.\n\n## Planning Tips for a Spanish Golf Trip\n\n- **Book tee times early** in peak months and for top‑tier courses.\n- **Mix marquee and hidden‑gem courses** for a better value itinerary.\n- **Build in rest days** for sightseeing and recovery—golf travel is a marathon.\n- **Check dress codes** and caddie policies before arrival.\n\n## Ready to Play?\n\nSpain combines elite golf with unforgettable travel. Add a round at a legendary Andalusian course, then follow the global tournaments that inspired your trip in the first place. When you’re ready, book a tee time and turn the dream into a tee‑sheet reality.\n",
      summary:
        "A concise guide to Spain’s best golf regions, what makes them special, and a quick tour of the global competitions that define the game.",
      imageUrl:
        "https://images.unsplash.com/photo-1500930289949-4efda8fe6f85?auto=format&fit=crop&q=80&w=1200",
      createdAt: new Date("2024-02-01") as Date | null,
    },
    {
      id: 5,
      title: "Spain's Golf Regions: Where to Play and Why It Matters",
      slug: "spain-golf-regions-where-to-play",
      content: `# Spain's Golf Regions: Where to Play and Why It Matters

Spain is one of the few countries where golf works almost every month of the year. Flights are easy, the infrastructure is excellent, and the variety is huge. The best way to plan a golf trip here is by region, because each area has its own style of courses, climate, and travel rhythm. This guide gives you a quick map of the major golf regions and what makes each one worth the tee time.

## Costa del Sol (Andalusia)

This is the headline region for Spanish golf. It has the most famous names, the most polished resort experiences, and the biggest concentration of championship venues. Expect immaculate conditioning, strong practice facilities, and iconic designs.

Highlights include Valderrama, Sotogrande, Finca Cortesin, La Reserva, and San Roque. If you want a once-in-a-lifetime trip, start here and build a 4-6 round itinerary.

## Costa Blanca (Alicante and Murcia)

Costa Blanca is the value-for-money champion. You can play great courses with less pressure on tee time availability and often better green fees. The courses are usually resort-friendly but still interesting, with modern layouts and generous fairways.

This region is especially good for groups that want to mix golf with beaches, dining, and an easy pace. It is also a smart shoulder-season option when demand in the south peaks.

## Catalonia (Barcelona and Girona)

Catalonia blends golf with city culture. You can stay in Barcelona and drive to courses around Girona or along the coast. The designs here tend to be more strategic and wooded, with strong elevation changes and visually memorable holes.

If you want a trip that combines golf with food, architecture, and nightlife, this is the best mix.

## Madrid and Central Spain

Central Spain is often overlooked, which is a good thing. Courses feel more local, tee times are easier to get, and you can enjoy golf without the busy resort vibe. Spring and autumn are ideal here; summer can be hot.

This region works best for golfers who want a shorter trip, or as an add-on to a city break in Madrid.

## Balearic Islands (Mallorca and Ibiza)

Mallorca is the star. The island has a strong mix of classic and resort layouts, high-end hotels, and a relaxed, upscale atmosphere. It is excellent for a premium golf holiday or a couples trip.

Ibiza has fewer courses, but the island lifestyle is the draw. For golfers who want a lighter schedule and more leisure time, it can be a great fit.

## Canary Islands (Tenerife and Gran Canaria)

If you want reliable winter golf, the Canary Islands are hard to beat. The climate stays mild when mainland Europe cools off. Expect coastal winds, unique volcanic terrain, and dramatic views.

The Canaries are ideal for winter escapes and long weekends.

## How to Choose the Right Region

- **First-timers** should start with Costa del Sol for the classic Spanish golf experience.
- **Value seekers** should look at Costa Blanca.
- **Food and culture fans** will enjoy Catalonia.
- **Winter golfers** should prioritize the Canary Islands.
- **Luxury trips** pair best with Mallorca or high-end Andalusian resorts.

## Practical Tips

- Book early for the marquee courses in high season.
- Mix premium and mid-tier courses to balance budget and variety.
- Start tee times early in summer to avoid midday heat.

Spain is built for golf travel. Choose the region that matches your pace, and you will end up with a trip worth repeating.
`,
      summary:
        "A regional guide to Spanish golf, covering where to play, what to expect, and how to plan the right trip.",
      imageUrl:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1200",
      createdAt: new Date("2024-02-03") as Date | null,
    },
    {
      id: 6,
      title: "Barcelona and Girona: A Golf Itinerary with City Energy",
      slug: "barcelona-girona-golf-itinerary",
      content: `# Barcelona and Girona: A Golf Itinerary with City Energy

If you want golf plus great food, culture, and walkable neighborhoods, the Barcelona and Girona region is a perfect match. You get coastal views, pine-lined fairways, and the option to base yourself in a vibrant city. This itinerary is designed for a long weekend or a five-day trip.

## Day 1: Arrive and Warm Up

Land in Barcelona and take the afternoon to settle in. If you want a light session, book a late tee time at a nearby club or visit a practice facility. Keep the evening for a relaxed dinner and an early night.

## Day 2: Coastal Golf and Classic Catalan Views

Start with a seaside course. Expect sea breezes and firm fairways that reward smart shot selection. Catalan courses often feel more strategic than resort layouts in the south, so accuracy matters.

After the round, head back into the city for tapas and a late stroll through the Gothic Quarter.

## Day 3: Girona for a Championship Feel

Drive up to Girona for a more secluded golf experience. The courses around Girona are often wooded, with elevation changes and excellent conditioning. They feel like a step up in difficulty, which makes them rewarding for better players.

Spend the evening in Girona itself. It is smaller than Barcelona, but packed with character, great restaurants, and scenic walks.

## Day 4: Flexible Day

Choose your pace:

- **Play another round** at a different style of course.
- **Explore** Barcelona museums and architecture.
- **Relax** with a beach day and a lighter schedule.

This is the day that makes the trip feel balanced. Golf is the anchor, but the city culture makes it memorable.

## Day 5: Morning Round and Departure

If your flight allows it, book a final morning tee time close to the airport. You will finish the trip on a high note and still travel comfortably.

## Practical Tips for Catalonia Golf

- **Tee times** can fill up quickly in spring and autumn. Book early.
- **Walking** is common, but check if a buggy is recommended on hilly layouts.
- **Weather** is mild, but the coast can be breezy. Pack a light layer.

## Why This Region Works

The Barcelona and Girona area gives you golf without the resort bubble. You can play excellent courses by day and enjoy a real city by night. For golfers who want both sport and lifestyle, it is a winning formula.
`,
      summary:
        "A practical itinerary for golfers who want Barcelona's city energy and Girona's championship-style courses.",
      imageUrl:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1200",
      createdAt: new Date("2024-02-05") as Date | null,
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
    {
      id: 4,
      title: "Episode 4: Spanish Golf Courses & Global Competitions",
      slug: "episode-4-spanish-courses-global-competitions",
      script:
        "Host: Welcome back to PlayGolfSpainNow. Today we’re taking a quick tour of Spanish golf courses and the global competitions that shape the game. Think of this as a five‑minute guide you can play on the way to your tee time.\n\nHost: Spain’s reputation as a golf destination is no accident. The Costa del Sol is the headline region, with famous courses like Valderrama, Sotogrande, and Finca Cortesin. These are the places golfers dream about, and the conditioning is world class.\n\nHost: For value and variety, the Costa Blanca delivers—plenty of resort‑style courses mixed with more strategic layouts. If you love golf with a city break, Catalonia gives you great golf near Barcelona and Girona, plus amazing food. And for winter sun, the Canary Islands stay green when the rest of Europe is cold.\n\nHost: What makes Spanish golf special? The variety. You’ll find scenic elevation changes, wide resort fairways, and tougher championship layouts—all within a few hours’ drive. Add excellent practice facilities and clubhouse culture, and it’s easy to see why golfers keep returning.\n\nHost: Now, let’s zoom out to the global stage. The four men’s majors—The Masters, PGA Championship, U.S. Open, and The Open—are the biggest weeks on the calendar. On the women’s side, the Chevron Championship, U.S. Women’s Open, Women’s PGA, Evian, and AIG Women’s Open are the top events. And for team golf, nothing tops the Ryder Cup and the Solheim Cup.\n\nHost: Beyond the majors, the PGA Tour and DP World Tour are where most elite players spend the season, while the LPGA Tour is the most international circuit in the game. New stars emerge on the Asian Tour and Sunshine Tour, too.\n\nHost: Here’s a practical tip: when a course hosts a major or a Ryder Cup, it often becomes a bucket‑list course. It’s a great way to plan future golf trips—watch a tournament, then play the venue later.\n\nHost: If Spain is on your list, the sweet spots are spring and autumn. Book tee times early for the famous courses, mix big‑name venues with hidden gems, and leave time for a rest day. You’ll get the best of the golf and the travel experience.\n\nHost: That’s your five‑minute guide. If you’re ready to play, explore the courses and book a tee time. Until next time, happy golfing.",
      audioUrl: null,
      createdAt: new Date("2024-02-01") as Date | null,
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

  async deleteArticle(id: number): Promise<boolean> {
    const index = this.articles.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.articles.splice(index, 1);
    return true;
  }

  async updateArticle(id: number, data: Partial<InsertArticle>): Promise<Article | undefined> {
    const article = this.articles.find(a => a.id === id);
    if (!article) return undefined;
    Object.assign(article, data);
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
    const normalizedEmail = normalizeEmail(email);
    // Check if already subscribed
    const existing = this.subscribers.find(s => s.email === normalizedEmail);
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
      email: normalizedEmail,
      subscribed: true,
      createdAt: new Date(),
    };
    this.subscribers.push(subscriber);
    return subscriber;
  }

  async getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    const normalizedEmail = normalizeEmail(email);
    return this.subscribers.find(s => s.email === normalizedEmail);
  }

  async getAllSubscribers(): Promise<NewsletterSubscriber[]> {
    return this.subscribers.filter(s => s.subscribed);
  }
}

// Try to use database storage, fall back to mock if database is not available
// Initialize immediately with MockStorage to avoid undefined access
let storage: IStorage = new MockStorage();

async function initializeStorage(): Promise<IStorage> {
  const { initializeStorageWithFallback } = await import("./storage-utils");

  return initializeStorageWithFallback({
    mockStorage: new MockStorage(),
    logPrefix: "storage",
    databaseStorageFactory: async (db) => {
      const { articles, podcasts, bookings, newsletterSubscribers } = await import("@shared/schema");
      const { eq, desc } = await import("drizzle-orm");

      class DatabaseStorage implements IStorage {
        async getArticles(): Promise<Article[]> {
          return await db.select().from(articles).orderBy(desc(articles.createdAt));
        }

        async getArticleBySlug(slug: string): Promise<Article | undefined> {
          const [article] = await db.select().from(articles).where(eq(articles.slug, slug));
          return article;
        }

        async createArticle(insertArticle: InsertArticle): Promise<Article> {
          const [article] = await db.insert(articles).values(insertArticle).returning();
          return article;
        }

        async deleteArticle(id: number): Promise<boolean> {
          const result = await db.delete(articles).where(eq(articles.id, id)).returning();
          return result.length > 0;
        }

        async updateArticle(id: number, data: Partial<InsertArticle>): Promise<Article | undefined> {
          const [article] = await db.update(articles).set(data).where(eq(articles.id, id)).returning();
          return article;
        }

        async getPodcasts(): Promise<Podcast[]> {
          return await db.select().from(podcasts).orderBy(desc(podcasts.createdAt));
        }

        async getPodcastBySlug(slug: string): Promise<Podcast | undefined> {
          const [podcast] = await db.select().from(podcasts).where(eq(podcasts.slug, slug));
          return podcast;
        }

        async createPodcast(insertPodcast: InsertPodcast): Promise<Podcast> {
          const [podcast] = await db.insert(podcasts).values(insertPodcast).returning();
          return podcast;
        }

        async createBooking(insertBooking: InsertBooking): Promise<Booking> {
          const [booking] = await db.insert(bookings).values(insertBooking).returning();
          return booking;
        }

        async subscribeToNewsletter(email: string): Promise<NewsletterSubscriber> {
          const normalizedEmail = normalizeEmail(email);
          // Check if already subscribed
          const existing = await this.getSubscriberByEmail(normalizedEmail);
          if (existing && existing.subscribed) {
            throw new Error("Email already subscribed");
          }

          if (existing) {
            // Reactivate subscription
            const [updated] = await db
              .update(newsletterSubscribers)
              .set({ subscribed: true })
              .where(eq(newsletterSubscribers.email, normalizedEmail))
              .returning();
            return updated;
          }

          const [subscriber] = await db
            .insert(newsletterSubscribers)
            .values({ email: normalizedEmail, subscribed: true })
            .returning();
          return subscriber;
        }

        async getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
          const normalizedEmail = normalizeEmail(email);
          const [subscriber] = await db
            .select()
            .from(newsletterSubscribers)
            .where(eq(newsletterSubscribers.email, normalizedEmail));
          return subscriber;
        }

        async getAllSubscribers(): Promise<NewsletterSubscriber[]> {
          return await db
            .select()
            .from(newsletterSubscribers)
            .where(eq(newsletterSubscribers.subscribed, true));
        }
      }

      return new DatabaseStorage();
    },
  });
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
