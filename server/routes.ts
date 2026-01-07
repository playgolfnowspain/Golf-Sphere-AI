import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";

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
  if (existingArticles.length === 0) {
    await storage.createArticle({
      title: "Top 5 Golf Courses in Costa del Sol",
      slug: "top-5-costa-del-sol",
      content: "Costa del Sol is a golfer's paradise. Here are the top 5 courses you must play... Valderrama, Sotogrande, Finca Cortesin...",
      summary: "Discover the best courses in the south of Spain.",
      imageUrl: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1000",
    });
    await storage.createArticle({
      title: "How to Improve Your Swing for Spanish Courses",
      slug: "improve-swing-spanish-courses",
      content: "Spanish courses can be windy. Keep your ball low and...",
      summary: "Tips for playing in the unique conditions of Spain.",
      imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=1000",
    });
  }

  const existingPodcasts = await storage.getPodcasts();
  if (existingPodcasts.length === 0) {
    await storage.createPodcast({
      title: "Episode 1: Golfing in Andalusia",
      slug: "episode-1-andalusia",
      script: "Host: Welcome to Golf Talk Spain! Today we discuss the beautiful region of Andalusia...\nGuest: Ideally, you want to book in spring...",
    });
  }
}
