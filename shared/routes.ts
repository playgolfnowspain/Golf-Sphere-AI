import { z } from 'zod';
import { insertArticleSchema, insertPodcastSchema, insertBookingSchema, insertNewsletterSubscriberSchema, articles, podcasts, bookings, newsletterSubscribers } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  articles: {
    list: {
      method: 'GET' as const,
      path: '/api/articles',
      responses: {
        200: z.array(z.custom<typeof articles.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/articles/:slug',
      responses: {
        200: z.custom<typeof articles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: { // For the agent to post
      method: 'POST' as const,
      path: '/api/articles',
      input: insertArticleSchema,
      responses: {
        201: z.custom<typeof articles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/articles/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
  },
  podcasts: {
    list: {
      method: 'GET' as const,
      path: '/api/podcasts',
      responses: {
        200: z.array(z.custom<typeof podcasts.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/podcasts/:slug',
      responses: {
        200: z.custom<typeof podcasts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: { // For the agent to post
      method: 'POST' as const,
      path: '/api/podcasts',
      input: insertPodcastSchema,
      responses: {
        201: z.custom<typeof podcasts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  bookings: {
    create: {
      method: 'POST' as const,
      path: '/api/bookings',
      input: insertBookingSchema,
      responses: {
        201: z.custom<typeof bookings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  newsletter: {
    subscribe: {
      method: 'POST' as const,
      path: '/api/newsletter/subscribe',
      input: insertNewsletterSubscriberSchema,
      responses: {
        201: z.custom<typeof newsletterSubscribers.$inferSelect>(),
        400: errorSchemas.validation,
        409: z.object({ message: z.string(), error: z.literal('already_subscribed') }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ArticleInput = z.infer<typeof api.articles.create.input>;
export type PodcastInput = z.infer<typeof api.podcasts.create.input>;
export type BookingInput = z.infer<typeof api.bookings.create.input>;
