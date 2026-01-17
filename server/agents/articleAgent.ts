import cron from "node-cron";
import OpenAI from "openai";
import { storage } from "../storage";

type Provider = "openai" | "perplexity";

const DEFAULT_TOPIC = "Spanish golf courses";
const DEFAULT_WORD_RANGE = { min: 900, max: 1100 };
const DEFAULT_TIMEZONE = "Europe/Madrid";
const DEFAULT_BATCH_COUNT = 1;
const DEFAULT_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1500930289949-4efda8fe6f85?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&q=80&w=1400",
];
const DEFAULT_BOOTSTRAP_TOPICS = [
  "Costa del Sol golf courses and trip planning",
  "Mallorca golf week itinerary and resort courses",
  "Barcelona and Girona golf itinerary",
  "Canary Islands winter golf guide",
  "Hidden gems in Spain for golf travelers",
];

let running = false;

function buildAiClient(): { client: OpenAI; provider: Provider; model: string } | null {
  const openaiApiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const openaiBaseUrl =
    process.env.OPENAI_BASE_URL || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1";
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  const perplexityBaseUrl = process.env.PERPLEXITY_BASE_URL || "https://api.perplexity.ai";

  const openaiClient = openaiApiKey
    ? new OpenAI({ apiKey: openaiApiKey, baseURL: openaiBaseUrl })
    : null;
  const perplexityClient = perplexityApiKey
    ? new OpenAI({ apiKey: perplexityApiKey, baseURL: perplexityBaseUrl })
    : null;

  const providerPreference = process.env.AI_PROVIDER;

  if (providerPreference === "perplexity" && perplexityClient) {
    return {
      client: perplexityClient,
      provider: "perplexity",
      model: process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-large-32k-online",
    };
  }

  if (providerPreference === "openai" && openaiClient) {
    return {
      client: openaiClient,
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }

  if (openaiClient) {
    return {
      client: openaiClient,
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }

  if (perplexityClient) {
    return {
      client: perplexityClient,
      provider: "perplexity",
      model: process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-large-32k-online",
    };
  }

  return null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function formatDateInTz(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

function extractJsonBlock(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function fallbackSummary(content: string): string {
  const firstParagraph = content.split("\n\n").find((paragraph) => paragraph.trim().length > 0) || "";
  return firstParagraph.replace(/^#+\s*/, "").slice(0, 240);
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (await storage.getArticleBySlug(slug)) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
  return slug;
}

async function generateArticle(options?: {
  topic?: string;
  imageUrl?: string;
  skipDailyCheck?: boolean;
  useDateInSlug?: boolean;
}) {
  const ai = buildAiClient();
  if (!ai) {
    console.warn("[article-agent] No AI provider configured. Skipping generation.");
    return null;
  }

  const topic = options?.topic || process.env.ARTICLE_AGENT_TOPIC || DEFAULT_TOPIC;
  const timeZone = process.env.ARTICLE_AGENT_TZ || DEFAULT_TIMEZONE;
  const todayKey = formatDateInTz(new Date(), timeZone);
  const existing = await storage.getArticles();
  const alreadyGenerated = existing.some((article) => {
    if (!article.createdAt) return false;
    const created = typeof article.createdAt === "string" ? new Date(article.createdAt) : article.createdAt;
    return formatDateInTz(created, timeZone) === todayKey;
  });

  if (alreadyGenerated && !options?.skipDailyCheck) {
    console.log(`[article-agent] Article already generated for ${todayKey}. Skipping.`);
    return null;
  }

  const wordRange = DEFAULT_WORD_RANGE;
  const systemPrompt =
    "You are a professional golf travel writer. Write detailed, practical, and inspiring guides for golfers.";
  const userPrompt = [
    `Write a ~5 minute read (${wordRange.min}-${wordRange.max} words) article about ${topic}.`,
    "Focus on Spanish golf courses: regions, standout courses, what makes them special, and practical tips.",
    "Use Markdown with headings, short paragraphs, and a short bullet list.",
    "End with a short call-to-action encouraging readers to book a tee time.",
    "Return ONLY a JSON object with: title, summary, content.",
    "summary should be 1-2 sentences.",
  ].join("\n");

  const completion = await ai.client.chat.completions.create({
    model: ai.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_completion_tokens: 1800,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "";
  const jsonBlock = extractJsonBlock(raw);
  let title = `Spanish Golf Courses Guide - ${todayKey}`;
  let summary = "";
  let content = raw;

  if (jsonBlock) {
    try {
      const parsed = JSON.parse(jsonBlock);
      if (typeof parsed.title === "string") title = parsed.title;
      if (typeof parsed.summary === "string") summary = parsed.summary;
      if (typeof parsed.content === "string") content = parsed.content;
    } catch (error) {
      console.warn("[article-agent] Failed to parse JSON output:", error);
    }
  }

  if (!summary) {
    summary = fallbackSummary(content);
  }

  const useDateInSlug = options?.useDateInSlug ?? true;
  const baseSlug = useDateInSlug ? slugify(`${title}-${todayKey}`) : slugify(title);
  const slug = await ensureUniqueSlug(baseSlug);
  const imageUrl = options?.imageUrl || null;

  const article = await storage.createArticle({
    title,
    slug,
    content,
    summary,
    imageUrl,
  });

  console.log(`[article-agent] Article generated (${ai.provider}): ${article.slug}`);
  return article;
}

export async function runArticleAgent(options?: {
  count?: number;
  topic?: string;
  topics?: string[];
  skipDailyCheck?: boolean;
  useDateInSlug?: boolean;
}): Promise<void> {
  if (running) {
    console.log("[article-agent] Previous run still in progress. Skipping.");
    return;
  }
  running = true;
  try {
    const topics = options?.topics?.length ? options.topics : [];
    const count = topics.length > 0 ? topics.length : Math.max(1, options?.count ?? DEFAULT_BATCH_COUNT);
    const topic = options?.topic;
    for (let index = 0; index < count; index += 1) {
      const imageUrl = DEFAULT_IMAGE_URLS[index % DEFAULT_IMAGE_URLS.length];
      const selectedTopic = topics[index] || topic;
      await generateArticle({
        topic: selectedTopic,
        imageUrl,
        skipDailyCheck: options?.skipDailyCheck,
        useDateInSlug: options?.useDateInSlug,
      });
    }
  } catch (error) {
    console.error("[article-agent] Failed to generate article:", error);
  } finally {
    running = false;
  }
}

export function startArticleAgent(): void {
  const enabled = process.env.ARTICLE_AGENT_ENABLED
    ? process.env.ARTICLE_AGENT_ENABLED === "true"
    : process.env.NODE_ENV === "production";

  if (!enabled) {
    console.log("[article-agent] Disabled via ARTICLE_AGENT_ENABLED.");
    return;
  }

  const schedule = process.env.ARTICLE_AGENT_CRON || "0 6 * * *";
  const timeZone = process.env.ARTICLE_AGENT_TZ || DEFAULT_TIMEZONE;
  const bootstrapEnabled = process.env.ARTICLE_AGENT_BOOTSTRAP_ON_STARTUP === "true";
  const bootstrapTopicsEnv = process.env.ARTICLE_AGENT_TOPICS;
  const bootstrapTopics = bootstrapTopicsEnv
    ? bootstrapTopicsEnv.split("|").map((item) => item.trim()).filter(Boolean)
    : DEFAULT_BOOTSTRAP_TOPICS;

  cron.schedule(
    schedule,
    () => {
      void runArticleAgent();
    },
    { timezone: timeZone },
  );

  if (bootstrapEnabled) {
    void runArticleAgent({
      topics: bootstrapTopics,
      skipDailyCheck: true,
      useDateInSlug: false,
    });
  }

  console.log(`[article-agent] Scheduled daily run at "${schedule}" (${timeZone}).`);
}
