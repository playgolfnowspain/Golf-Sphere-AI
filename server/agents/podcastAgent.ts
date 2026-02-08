import cron from "node-cron";
import OpenAI from "openai";
import { storage } from "../storage";
import { generatePodcastAudio, estimateDuration } from "../services/elevenLabs";

type Provider = "openai" | "perplexity";

const DEFAULT_TIMEZONE = "Europe/Madrid";

// Same topics as article agent for consistency
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
      model: process.env.PERPLEXITY_MODEL || "sonar-pro",
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
      model: process.env.PERPLEXITY_MODEL || "sonar-pro",
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

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (await storage.getPodcastBySlug(slug)) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
  return slug;
}

async function generatePodcast(options?: {
  topic?: string;
  skipWeeklyCheck?: boolean;
}) {
  const ai = buildAiClient();
  if (!ai) {
    console.warn("[podcast-agent] No AI provider configured. Skipping generation.");
    return null;
  }

  const topic = options?.topic || getRandomTopic();
  const timeZone = process.env.PODCAST_AGENT_TZ || DEFAULT_TIMEZONE;
  const todayKey = formatDateInTz(new Date(), timeZone);

  // Check if we already generated a podcast today
  const existing = await storage.getPodcasts();
  const alreadyGenerated = existing.some((podcast) => {
    if (!podcast.createdAt) return false;
    const created = typeof podcast.createdAt === "string" ? new Date(podcast.createdAt) : podcast.createdAt;
    return formatDateInTz(created, timeZone) === todayKey;
  });

  if (alreadyGenerated && !options?.skipWeeklyCheck) {
    console.log(`[podcast-agent] Podcast already generated for ${todayKey}. Skipping.`);
    return null;
  }

  const systemPrompt = `You are a podcast script writer for a golf podcast called "Golf Talk Spain".
Write engaging, conversational dialogue between two hosts:
- Alex: Enthusiastic host who asks great questions and shares excitement
- Sam: The golf expert who provides deep insights and insider knowledge

The script should feel natural, like real podcast banter. Include some humor and personality.
Keep it concise - aim for about 3-5 minutes of audio when spoken.`;

  const userPrompt = `Write a podcast script about: ${topic}

The script should be a natural conversation between Alex and Sam discussing this topic.
Include:
- An engaging introduction
- Key insights and interesting facts
- Personal opinions and recommendations
- A memorable sign-off

Format the output as JSON with these fields:
{
  "title": "Episode title",
  "script": "The full dialogue script with each line prefixed by the speaker name like 'Alex: ...' or 'Sam: ...'"
}

Make sure each line of dialogue starts with either "Alex:" or "Sam:" on its own line.`;

  console.log(`[podcast-agent] Generating script for topic: ${topic}`);

  const completion = await ai.client.chat.completions.create({
    model: ai.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_completion_tokens: 2000,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "";
  const jsonBlock = extractJsonBlock(raw);
  let title = `Golf Talk Spain - ${todayKey}`;
  let script = raw;

  if (jsonBlock) {
    try {
      const parsed = JSON.parse(jsonBlock);
      if (typeof parsed.title === "string") title = parsed.title;
      if (typeof parsed.script === "string") script = parsed.script;
    } catch (error) {
      console.warn("[podcast-agent] Failed to parse JSON output:", error);
    }
  }

  console.log(`[podcast-agent] Script generated: "${title}"`);

  // Generate audio using ElevenLabs
  console.log("[podcast-agent] Generating audio with ElevenLabs...");
  const audioUrl = await generatePodcastAudio(script);

  if (!audioUrl) {
    console.warn("[podcast-agent] Audio generation failed or skipped. Saving podcast without audio.");
  } else {
    console.log("[podcast-agent] Audio generated successfully.");
  }

  const baseSlug = slugify(`${title}-${todayKey}`);
  const slug = await ensureUniqueSlug(baseSlug);

  const podcast = await storage.createPodcast({
    title,
    slug,
    script,
    audioUrl,
  });

  console.log(`[podcast-agent] Podcast created (${ai.provider}): ${podcast.slug}`);
  return podcast;
}

export async function runPodcastAgent(options?: {
  topic?: string;
  skipWeeklyCheck?: boolean;
}): Promise<{ podcast: Awaited<ReturnType<typeof generatePodcast>> } | null> {
  if (running) {
    console.log("[podcast-agent] Previous run still in progress. Skipping.");
    return null;
  }
  running = true;
  try {
    const podcast = await generatePodcast({
      topic: options?.topic,
      skipWeeklyCheck: options?.skipWeeklyCheck,
    });
    return { podcast };
  } catch (error) {
    console.error("[podcast-agent] Failed to generate podcast:", error);
    return null;
  } finally {
    running = false;
  }
}

export function startPodcastAgent(): void {
  const enabled = process.env.PODCAST_AGENT_ENABLED
    ? process.env.PODCAST_AGENT_ENABLED === "true"
    : process.env.NODE_ENV === "production";

  if (!enabled) {
    console.log("[podcast-agent] Disabled via PODCAST_AGENT_ENABLED.");
    return;
  }

  // Default: 1st and 15th of each month at 9 AM Madrid time
  const schedule = process.env.PODCAST_AGENT_CRON || "0 9 1,15 * *";
  const timeZone = process.env.PODCAST_AGENT_TZ || DEFAULT_TIMEZONE;

  cron.schedule(
    schedule,
    () => {
      void runPodcastAgent();
    },
    { timezone: timeZone },
  );

  console.log(`[podcast-agent] Scheduled weekly run at "${schedule}" (${timeZone}).`);
}
