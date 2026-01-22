import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./chat";
import { runArticleAgent } from "./agents/articleAgent";
import { runNewsletterAgent } from "./agents/newsletterAgent";
import { sendWelcomeEmail, sendSubscriptionNotification } from "./services/email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register AI Integration Routes
  registerChatRoutes(app);

  // Articles Routes
  app.get(api.articles.list.path, async (req, res) => {
    const articles = await storage.getArticles();
    res.json(articles);
  });

  app.get(api.articles.get.path, async (req, res) => {
    const article = await storage.getArticleBySlug(req.params.slug);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json(article);
  });

  app.post(api.articles.create.path, async (req, res) => {
    try {
      const input = api.articles.create.input.parse(req.body);
      const article = await storage.createArticle(input);
      res.status(201).json(article);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }
    const deleted = await storage.deleteArticle(id);
    if (!deleted) {
      return res.status(404).json({ message: "Article not found" });
    }
    res.json({ success: true });
  });

  app.put("/api/articles/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }
    const article = await storage.updateArticle(id, req.body);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    res.json(article);
  });

  // Article Agent (manual trigger)
  app.post("/api/agent/articles/run", async (req, res) => {
    const token = process.env.ARTICLE_AGENT_TOKEN;
    if (token && req.headers["x-agent-token"] !== token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const count = typeof req.body?.count === "number" ? req.body.count : undefined;
    const topic = typeof req.body?.topic === "string" ? req.body.topic : undefined;
    const topics = Array.isArray(req.body?.topics) ? req.body.topics.filter((item: unknown) => typeof item === "string") : undefined;
    const skipDailyCheck = req.body?.skipDailyCheck === true;

    await runArticleAgent({ count, topic, topics, skipDailyCheck });
    res.status(202).json({ message: "Article agent triggered", count: count ?? 1 });
  });

  // Newsletter Agent (manual trigger)
  app.post("/api/agent/newsletter/run", async (req, res) => {
    const token = process.env.NEWSLETTER_AGENT_TOKEN;
    if (token && req.headers["x-agent-token"] !== token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await runNewsletterAgent();
    if (result === null) {
      return res.status(500).json({ message: "Newsletter generation failed or already in progress" });
    }

    res.status(202).json({
      message: "Newsletter sent",
      sent: result.sent,
      failed: result.failed,
    });
  });

  // Podcasts Routes
  app.get(api.podcasts.list.path, async (req, res) => {
    const podcasts = await storage.getPodcasts();
    res.json(podcasts);
  });

  app.get(api.podcasts.get.path, async (req, res) => {
    const podcast = await storage.getPodcastBySlug(req.params.slug);
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }
    res.json(podcast);
  });

  app.post(api.podcasts.create.path, async (req, res) => {
    try {
      const input = api.podcasts.create.input.parse(req.body);
      const podcast = await storage.createPodcast(input);
      res.status(201).json(podcast);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Bookings Routes
  app.post(api.bookings.create.path, async (req, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const booking = await storage.createBooking(input);
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Newsletter Routes
  app.post(api.newsletter.subscribe.path, async (req, res) => {
    try {
      const input = api.newsletter.subscribe.input.parse(req.body);
      const subscriber = await storage.subscribeToNewsletter(input.email);

      // Send emails asynchronously (don't block the response)
      Promise.all([
        sendWelcomeEmail(input.email),
        sendSubscriptionNotification(input.email),
      ]).catch((err) => {
        console.error("[newsletter] Failed to send subscription emails:", err);
      });

      res.status(201).json(subscriber);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      if (err instanceof Error && err.message === "Email already subscribed") {
        return res.status(409).json({
          message: "This email is already subscribed to our newsletter",
          error: "already_subscribed" as const,
        });
      }
      throw err;
    }
  });

  // Seed Data
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingArticles = await storage.getArticles();
  const articleSlugs = new Set(existingArticles.map((article) => article.slug));
  if (!articleSlugs.has("top-5-costa-del-sol")) {
    await storage.createArticle({
      title: "Top 5 Golf Courses in Costa del Sol",
      slug: "top-5-costa-del-sol",
      content: "Costa del Sol is a golfer's paradise. Here are the top 5 courses you must play... Valderrama, Sotogrande, Finca Cortesin...",
      summary: "Discover the best courses in the south of Spain.",
      imageUrl: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1000",
    });
  }
  if (!articleSlugs.has("improve-swing-spanish-courses")) {
    await storage.createArticle({
      title: "How to Improve Your Swing for Spanish Courses",
      slug: "improve-swing-spanish-courses",
      content: "Spanish courses can be windy. Keep your ball low and...",
      summary: "Tips for playing in the unique conditions of Spain.",
      imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=1000",
    });
  }
  if (!articleSlugs.has("spanish-golf-courses-global-competitions")) {
    await storage.createArticle({
      title: "Spanish Golf Courses & Global Competitions: A 5-Minute Guide",
      slug: "spanish-golf-courses-global-competitions",
      content:
        "# Spanish Golf Courses & Global Competitions: A 5-Minute Guide\n\nSpain is one of Europe’s most reliable golf destinations: sunshine, great infrastructure, and a wide mix of classic championship layouts and resort-style courses. But the sport doesn’t stop at Spain’s borders—global competitions shape the seasons, the storylines, and the dream courses golfers want to play. Here’s a concise guide to Spain’s standout regions, what makes Spanish golf special, and a quick tour of the competitions that define the worldwide calendar.\n\n## Why Spain is a Golf Powerhouse\n\nSpain offers year-round play in many regions, easy access from major European hubs, and a culture that treats golf as part of the travel experience. Many courses are designed to showcase dramatic views—sea, mountains, and olive groves—while remaining playable for visitors.\n\n### The Key Spanish Golf Regions\n\n**Costa del Sol (Andalusia)**\nOften called the “Costa del Golf,” this region is famous for marquee courses and serious pedigree. Think Valderrama, Sotogrande, and Finca Cortesin—polished facilities, iconic holes, and immaculate conditioning. It’s the classic choice for a golf-focused holiday.\n\n**Costa Blanca (Alicante & Murcia)**\nGreat value meets variety. You’ll find resort-style courses with forgiving fairways alongside tighter, strategic layouts. The weather stays mild into late autumn and early spring, making it a strong shoulder‑season option.\n\n**Catalonia (Barcelona & Girona)**\nDesign-forward courses, excellent food, and easy city access. The area blends coastal layouts with inland, pine‑lined courses. Ideal for golfers who want a city‑plus‑golf itinerary.\n\n**Madrid & Central Spain**\nA short drive from the capital brings you to high‑quality clubs that feel more local and less tourist‑heavy. Summers are hot, but spring and autumn are excellent.\n\n**Balearic Islands (Mallorca, Ibiza)**\nMallorca is the standout for golf with scenic courses and high-end resorts. Ibiza has fewer courses but offers a unique lifestyle add‑on for a leisure‑heavy trip.\n\n**Canary Islands (Tenerife, Gran Canaria)**\nWhen winter hits the north of Europe, the Canaries stay green and playable. Expect volcanic terrain, coastal winds, and a dramatic landscape.\n\n## What Makes Spanish Courses Special\n\n- **Strategic variety:** Many layouts blend resort playability with tournament‑style challenges.\n- **Scenic elevation changes:** Hillside courses offer beautiful, memorable holes.\n- **Practice facilities:** Spain’s top clubs invest heavily in ranges and short‑game areas.\n- **Clubhouse culture:** Great dining and social spaces are the norm—perfect for post‑round tapas.\n\n## When to Go\n\nThe best windows are **March–May** and **September–November**, with comfortable temperatures and great course conditions. Summers can be hot, so early‑morning tee times are ideal. Winter golf in the south remains a major draw for northern Europeans.\n\n## Golf Competitions Around the World\n\nIf Spain is where many golfers want to play, global competitions are what keep the game’s momentum going year‑round. Here’s a quick, practical overview of the main events and tours that shape the calendar.\n\n### The Majors (Men)\n- **The Masters (Augusta National)** – The most iconic venue in golf.\n- **PGA Championship** – A deep field with modern championship setups.\n- **U.S. Open** – Known for demanding conditions.\n- **The Open Championship** – Links golf and historic tradition.\n\n### The Majors (Women)\n- **Chevron Championship**\n- **U.S. Women’s Open**\n- **Women’s PGA Championship**\n- **The Evian Championship**\n- **AIG Women’s Open**\n\n### International Team Events\n- **Ryder Cup** – Europe vs. USA, the ultimate team showdown.\n- **Solheim Cup** – Women’s equivalent, fiercely competitive.\n- **Presidents Cup** – USA vs. International team (excluding Europe).\n\n### Global Tours to Watch\n- **PGA Tour** – USA’s flagship tour, featuring the deepest fields.\n- **DP World Tour** – Strong European circuit with global stops.\n- **LPGA Tour** – World’s top women’s tour, truly international.\n- **Asian Tour & Sunshine Tour** – Great for discovering rising talent.\n\nThese tours influence where golfers travel. A venue hosting a major or a Ryder Cup often becomes a bucket‑list course for years afterwards.\n\n## Planning Tips for a Spanish Golf Trip\n\n- **Book tee times early** in peak months and for top‑tier courses.\n- **Mix marquee and hidden‑gem courses** for a better value itinerary.\n- **Build in rest days** for sightseeing and recovery—golf travel is a marathon.\n- **Check dress codes** and caddie policies before arrival.\n\n## Ready to Play?\n\nSpain combines elite golf with unforgettable travel. Add a round at a legendary Andalusian course, then follow the global tournaments that inspired your trip in the first place. When you’re ready, book a tee time and turn the dream into a tee‑sheet reality.\n",
      summary:
        "A concise guide to Spain’s best golf regions, what makes them special, and a quick tour of the global competitions that define the game.",
      imageUrl: "https://images.unsplash.com/photo-1500930289949-4efda8fe6f85?auto=format&fit=crop&q=80&w=1200",
    });
  }
  if (!articleSlugs.has("spain-golf-regions-where-to-play")) {
    await storage.createArticle({
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

If you want reliable winter golf, the Canary Islands are hard to beat. The climate stays mild when mainland Europe cools off. Expect volcanic terrain, coastal winds, and dramatic views.

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
    });
  }
  if (!articleSlugs.has("barcelona-girona-golf-itinerary")) {
    await storage.createArticle({
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
    });
  }
  if (!articleSlugs.has("mallorca-golf-week")) {
    await storage.createArticle({
      title: "Mallorca Golf Week: Sun, Sea, and Resort Courses",
      slug: "mallorca-golf-week",
      content: `# Mallorca Golf Week: Sun, Sea, and Resort Courses

Mallorca is the Balearic island that delivers the most complete golf experience. The island has a strong lineup of courses, excellent hotels, and a relaxed rhythm that suits both golfers and non-golfers. This guide shows how to build a one-week golf trip that feels premium without being rushed.

## The Mallorca Golf Style

Courses here blend resort playability with smart design. Fairways are usually generous, but you will still face strategic choices and a few signature holes. The real standout is the scenery: Mediterranean views, rolling hills, and clean, modern clubhouses.

## A 6-Round Plan (Adjust as Needed)

**Day 1:** Arrive and play an afternoon warm-up round close to your hotel.  
**Day 2:** Choose a championship-style course and play early.  
**Day 3:** Rest or add a light round with a shorter course.  
**Day 4:** Play a coastal course with wide views and sea breezes.  
**Day 5:** Mix in a scenic inland course with elevation changes.  
**Day 6:** Your favorite course again, or a new challenge.  
**Day 7:** Travel day or a final short round if time allows.

The goal is variety: one premium course, one coastal course, one inland course, and a couple of rounds that match your energy.

## Where to Stay

The best strategy is to stay near Palma for convenience, then drive out for golf. You can reach most courses in under an hour. If you want a resort-based trip, choose a property with a course on-site, but do not limit yourself to only one venue.

## When to Go

Spring and autumn are ideal. Summer is hot, but early tee times solve the problem. Winter is still playable but can be cooler and breezier.

## Tips That Make the Trip Better

- **Book tee times early** for the most popular courses.
- **Bring a light jacket** for early mornings and coastal winds.
- **Plan one non-golf day** for beaches, food, or a boat trip.

Mallorca gives you the comfort of a resort trip with the flexibility of an island adventure. If you want a polished golf holiday that still feels relaxed, this is the best place in Spain to start.
`,
      summary:
        "A one-week Mallorca golf plan with course variety, resort comfort, and practical travel tips.",
      imageUrl:
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&q=80&w=1200",
    });
  }
  if (!articleSlugs.has("canary-islands-winter-golf")) {
    await storage.createArticle({
      title: "Canary Islands Winter Golf: Where the Season Never Ends",
      slug: "canary-islands-winter-golf",
      content: `# Canary Islands Winter Golf: Where the Season Never Ends

When winter arrives in northern Europe, the Canary Islands remain green and playable. Tenerife and Gran Canaria are the two islands with the strongest golf infrastructure, and both deliver a mix of coastal winds, volcanic terrain, and dramatic scenery. If you want reliable winter tee times, this is the best place to look.

## Why the Canaries Work

The weather is mild year-round. That means you can plan a December or January golf break without worrying about frost delays or closed courses. Flights from the UK and mainland Europe are frequent, and accommodation ranges from value hotels to high-end resorts.

## Tenerife vs Gran Canaria

**Tenerife** offers dramatic views, bigger elevation changes, and some of the most memorable holes in Spain. The courses feel more dramatic and scenic, with higher risk-reward moments.

**Gran Canaria** has a mix of traditional parkland layouts and coastal resort courses. It is often slightly quieter and is a good fit for golfers who want a slower pace.

## Course Style

Expect a mix of wide fairways and strategic greens. Wind is part of the challenge, especially along the coast. You will want to keep your ball flight under control and plan for a few creative recovery shots.

## Travel Tips

- **Book morning tee times** if you want calmer wind.
- **Stay near the south** of the islands for the best weather.
- **Pack layers** for early starts and breezy rounds.

## A Simple 4-Day Plan

**Day 1:** Arrival and an easy afternoon round.  
**Day 2:** Championship round with elevation and big views.  
**Day 3:** Rest day or a short par-3 course.  
**Day 4:** Coastal round and departure.

## The Bottom Line

The Canary Islands are not just a winter alternative. They are a premium golf destination in their own right, with unique landscapes and reliable conditions. If you want to keep your game sharp through winter, this is the easiest win in Spain.
`,
      summary:
        "A winter golf guide to Tenerife and Gran Canaria, with course style and travel tips.",
      imageUrl:
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&q=80&w=1200",
    });
  }
  if (!articleSlugs.has("hidden-gems-spain-golf-courses")) {
    await storage.createArticle({
      title: "Hidden Gems in Spain: Great Courses Beyond the Headlines",
      slug: "hidden-gems-spain-golf-courses",
      content: `# Hidden Gems in Spain: Great Courses Beyond the Headlines

Spain has famous courses that every golfer knows, but some of the best experiences come from less publicized clubs. These courses offer great value, fewer crowds, and a more local feel. If you want to build a trip that balances marquee rounds with authentic discoveries, start here.

## Why Hidden Gems Matter

Big-name courses are a must for many golfers, but they are not the whole story. A well-balanced itinerary includes at least one or two quieter rounds where you can relax, play at your own pace, and enjoy a different style of design.

## What to Look For

- **Strong conditioning** without the premium price tag.
- **Playable layouts** that still reward smart decisions.
- **Easy access** from airports or major towns.
- **Local clubhouse culture** with great food and friendly service.

## Regions That Deliver

**Inland Andalusia:** You will find excellent courses away from the coast, often with more space and less traffic.  
**Northern Spain:** Cooler temperatures in summer and a totally different landscape.  
**Central Spain:** Great clubs close to Madrid with a local feel and easier access.  
**Costa Blanca:** Plenty of mid-tier courses that still offer great design value.

## How to Blend a Trip

Here is a simple approach:

1. **Book one marquee course** for the big experience.  
2. **Add two mid-tier courses** with great reviews and strong practice facilities.  
3. **Include one hidden gem** for a relaxed day and better value.

This mix gives you variety without overspending.

## Budget and Booking Tips

- **Play mid-week** if possible for better availability.
- **Look for twilight rates** in summer when courses want extra rounds.
- **Ask for package pricing** if you are booking multiple rounds.

## The Takeaway

The famous courses are great, but the hidden gems are what make Spanish golf feel personal. Mix both, and your trip will have the best of everything: the headlines and the surprises.
`,
      summary:
        "A practical guide to lesser-known Spanish courses, how to find them, and how to build a balanced itinerary.",
      imageUrl:
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&q=80&w=1200",
    });
  }

  const existingPodcasts = await storage.getPodcasts();
  const podcastSlugs = new Set(existingPodcasts.map((podcast) => podcast.slug));
  if (!podcastSlugs.has("episode-1-andalusia")) {
    await storage.createPodcast({
      title: "Episode 1: Golfing in Andalusia",
      slug: "episode-1-andalusia",
      script: "Host: Welcome to Golf Talk Spain! Today we discuss the beautiful region of Andalusia...\nGuest: Ideally, you want to book in spring...",
    });
  }
  if (!podcastSlugs.has("episode-4-spanish-courses-global-competitions")) {
    await storage.createPodcast({
      title: "Episode 4: Spanish Golf Courses & Global Competitions",
      slug: "episode-4-spanish-courses-global-competitions",
      script:
        "Host: Welcome back to PlayGolfSpainNow. Today we’re taking a quick tour of Spanish golf courses and the global competitions that shape the game. Think of this as a five‑minute guide you can play on the way to your tee time.\n\nHost: Spain’s reputation as a golf destination is no accident. The Costa del Sol is the headline region, with famous courses like Valderrama, Sotogrande, and Finca Cortesin. These are the places golfers dream about, and the conditioning is world class.\n\nHost: For value and variety, the Costa Blanca delivers—plenty of resort‑style courses mixed with more strategic layouts. If you love golf with a city break, Catalonia gives you great golf near Barcelona and Girona, plus amazing food. And for winter sun, the Canary Islands stay green when the rest of Europe is cold.\n\nHost: What makes Spanish golf special? The variety. You’ll find scenic elevation changes, wide resort fairways, and tougher championship layouts—all within a few hours’ drive. Add excellent practice facilities and clubhouse culture, and it’s easy to see why golfers keep returning.\n\nHost: Now, let’s zoom out to the global stage. The four men’s majors—The Masters, PGA Championship, U.S. Open, and The Open—are the biggest weeks on the calendar. On the women’s side, the Chevron Championship, U.S. Women’s Open, Women’s PGA, Evian, and AIG Women’s Open are the top events. And for team golf, nothing tops the Ryder Cup and the Solheim Cup.\n\nHost: Beyond the majors, the PGA Tour and DP World Tour are where most elite players spend the season, while the LPGA Tour is the most international circuit in the game. New stars emerge on the Asian Tour and Sunshine Tour, too.\n\nHost: Here’s a practical tip: when a course hosts a major or a Ryder Cup, it often becomes a bucket‑list course. It’s a great way to plan future golf trips—watch a tournament, then play the venue later.\n\nHost: If Spain is on your list, the sweet spots are spring and autumn. Book tee times early for the famous courses, mix big‑name venues with hidden gems, and leave time for a rest day. You’ll get the best of the golf and the travel experience.\n\nHost: That’s your five‑minute guide. If you’re ready to play, explore the courses and book a tee time. Until next time, happy golfing.",
    });
  }
}
