import cron from "node-cron";
import OpenAI from "openai";
import { storage } from "../storage";

type Provider = "openai" | "perplexity";

const DEFAULT_WORD_RANGE = { min: 700, max: 900 };
const DEFAULT_TIMEZONE = "Europe/Madrid";
const DEFAULT_BATCH_COUNT = 1;
const DEFAULT_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1611374243147-44a702c2d44c?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1596727362302-b8d891c42ab8?auto=format&fit=crop&q=80&w=1400",
];

// Rotating topics for daily variety
const SPANISH_COURSES = [
  "Valderrama Golf Club - host of 1997 Ryder Cup",
  "Real Club de Golf Sotogrande",
  "Finca Cortesin Golf Club",
  "PGA Catalunya Resort",
  "La Reserva Club de Golf Sotogrande",
  "Real Club Sevilla Golf",
  "Club de Golf Alcanada in Mallorca",
  "Golf Costa Adeje in Tenerife",
  "Real Club de Golf El Prat near Barcelona",
  "Abama Golf in Tenerife",
  "Son Gual Golf in Mallorca",
  "Arabella Golf Son Muntaner in Mallorca",
  "La Manga Club in Murcia",
  "Las Colinas Golf in Alicante",
  "Aloha Golf Club in Marbella",
  "Los Naranjos Golf Club in Marbella",
  "Marbella Golf Country Club",
  "San Roque Club in Cadiz",
  "Golf Santander in Madrid",
  "Club de Campo Villa de Madrid",
];

const WORLD_TOURNAMENTS = [
  "The Masters at Augusta National",
  "US Open Championship",
  "The Open Championship (British Open)",
  "PGA Championship",
  "Ryder Cup history and memorable moments",
  "DP World Tour Championship",
  "Players Championship at TPC Sawgrass",
  "WGC Match Play Championship",
  "Arnold Palmer Invitational",
  "The Memorial Tournament",
  "BMW PGA Championship at Wentworth",
  "Spanish Open history and champions",
  "Andalucia Masters at Valderrama",
  "Solheim Cup highlights",
  "LIV Golf and its impact on professional golf",
];

function getRandomTopic(): string {
  const allTopics = [...SPANISH_COURSES, ...WORLD_TOURNAMENTS];
  const randomIndex = Math.floor(Math.random() * allTopics.length);
  return allTopics[randomIndex];
}

const DEFAULT_BOOTSTRAP_TOPICS = [
  "Valderrama Golf Club - host of 1997 Ryder Cup",
  "The Masters at Augusta National",
  "PGA Catalunya Resort",
  "Ryder Cup history and memorable moments",
  "Finca Cortesin Golf Club",
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

  const topic = options?.topic || process.env.ARTICLE_AGENT_TOPIC || getRandomTopic();
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
    process.env.ARTICLE_AGENT_SYSTEM_PROMPT ||
    "You are an engaging golf journalist who writes exciting, well-researched articles about golf courses and tournaments. Your tone is enthusiastic but professional, like a knowledgeable friend sharing insider tips.";
  const userPrompt =
    process.env.ARTICLE_AGENT_PROMPT ||
    [
      `Write a 4-minute read (${wordRange.min}-${wordRange.max} words) article about: ${topic}`,
      "",
      "If this is about a GOLF COURSE, include:",
      "- The course's history and what makes it special",
      "- Signature holes and unique challenges",
      "- Famous tournaments or moments that happened there",
      "- Practical info: green fees, best time to visit",
      "- A 'Pro Tip' for playing the course",
      "",
      "If this is about a TOURNAMENT, include:",
      "- History and prestige of the event",
      "- Memorable moments and famous winners",
      "- What makes this tournament unique",
      "- The host course and its challenges",
      "- Recent champions or upcoming storylines",
      "",
      "Writing style:",
      "- Use Markdown with ## headers",
      "- Keep paragraphs short and punchy",
      "- Include specific facts, names, and dates",
      "- Make it exciting and informative",
      "",
      "Return ONLY a JSON object with these exact fields:",
      '{ "title": "Catchy article title", "summary": "1-2 sentence hook", "content": "Full markdown article" }',
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
