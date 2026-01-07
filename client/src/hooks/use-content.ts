import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ArticleInput, type PodcastInput, type BookingInput } from "@shared/routes";
import { insertBookingSchema } from "@shared/schema";

// Articles Hooks
export function useArticles() {
  return useQuery({
    queryKey: [api.articles.list.path],
    queryFn: async () => {
      const res = await fetch(api.articles.list.path);
      if (!res.ok) throw new Error("Failed to fetch articles");
      return api.articles.list.responses[200].parse(await res.json());
    },
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: [api.articles.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.articles.get.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch article");
      return api.articles.get.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}

// Podcasts Hooks
export function usePodcasts() {
  return useQuery({
    queryKey: [api.podcasts.list.path],
    queryFn: async () => {
      const res = await fetch(api.podcasts.list.path);
      if (!res.ok) throw new Error("Failed to fetch podcasts");
      return api.podcasts.list.responses[200].parse(await res.json());
    },
  });
}

export function usePodcast(slug: string) {
  return useQuery({
    queryKey: [api.podcasts.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.podcasts.get.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch podcast");
      return api.podcasts.get.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}

// Booking Hooks
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BookingInput) => {
      const validated = insertBookingSchema.parse(data); // Pre-validate
      const res = await fetch(api.bookings.create.path, {
        method: api.bookings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create booking");
      }
      return api.bookings.create.responses[201].parse(await res.json());
    },
    // No query invalidation needed as we don't list bookings publicly
  });
}

// Newsletter Hooks
export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(api.newsletter.subscribe.path, {
        method: api.newsletter.subscribe.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        if (res.status === 409) {
          const error = await res.json();
          throw new Error(error.message || "Email already subscribed");
        }
        throw new Error("Failed to subscribe");
      }
      return api.newsletter.subscribe.responses[201].parse(await res.json());
    },
  });
}
