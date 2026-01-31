import cron from "node-cron";
import OpenAI from "openai";
import { storage } from "../storage";
import { sendNewsletter, type NewsletterContent } from "../services/email";

type Provider = "openai" | "perplexity";

const DEFAULT_TIMEZONE = "Europe/Madrid";
const DEFAULT_CRON = "0 8 * * 1"; // Monday at 8 AM

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

  // For newsletter, prefer Perplexity for real-time news access
  const providerPreference = process.env.NEWSLETTER_AI_PROVIDER || process.env.AI_PROVIDER;

  if (providerPreference === "openai" && openaiClient) {
    return {
      client: openaiClient,
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }

  if (providerPreference === "perplexity" && perplexityClient) {
    return {
      client: perplexityClient,
      provider: "perplexity",
      model: process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-large-32k-online",
    };
  }

  // Default: prefer Perplexity for newsletters (real-time news)
  if (perplexityClient) {
    return {
      client: perplexityClient,
      provider: "perplexity",
      model: process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-large-32k-online",
    };
  }

  if (openaiClient) {
    return {
      client: openaiClient,
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }

  return null;
}

function formatDateForSubject(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: DEFAULT_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatter.format(now);
}

function extractJsonBlock(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function markdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gm, "<h3 style=\"color: #166534; margin-top: 25px; margin-bottom: 10px;\">$1</h3>")
    .replace(/^## (.*$)/gm, "<h2 style=\"color: #166534; margin-top: 30px; margin-bottom: 15px;\">$1</h2>")
    .replace(/^# (.*$)/gm, "<h1 style=\"color: #166534; margin-top: 30px; margin-bottom: 15px;\">$1</h1>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\" style=\"color: #166534;\">$1</a>")
    // Unordered lists
    .replace(/^\s*[-*]\s+(.*)$/gm, "<li>$1</li>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr style=\"border: none; border-top: 1px solid #ddd; margin: 25px 0;\">")
    // Paragraphs (double newlines)
    .replace(/\n\n/g, "</p><p style=\"margin: 15px 0;\">")
    // Single newlines within paragraphs
    .replace(/\n/g, "<br>");

  // Wrap lists
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, (match) => {
    return `<ul style="padding-left: 25px; margin: 15px 0;">${match}</ul>`;
  });

  return `<p style="margin: 15px 0;">${html}</p>`;
}

async function generateNewsletterContent(): Promise<NewsletterContent | null> {
  const ai = buildAiClient();
  if (!ai) {
    console.warn("[newsletter-agent] No AI provider configured. Skipping generation.");
    return null;
  }

  const systemPrompt = `You are a golf journalist writing a weekly newsletter for GolfSphere, a Spanish golf travel website. Your style is clean, modern, and scannable - like a premium tech newsletter but for golf.

Write content that's interesting and informative. Use short paragraphs, bullet points, and clear structure. Be conversational but knowledgeable.`;

  const userPrompt = `Write a weekly golf newsletter with this structure:

## PART 1: MAIN TOPIC (800-1000 words)
Pick ONE interesting topic and go deep. Choose from:
- Golf technology or equipment trends
- A famous golf course deep-dive
- Golf travel tips or destination guide
- A player profile or career retrospective
- Golf fitness, mental game, or technique
- The business of golf
- Golf history or traditions

Break it into 4-5 sections with clear ## headers. Use:
- Short paragraphs (2-3 sentences max)
- Bullet points for lists
- Specific facts, names, and examples
- A "The takeaway" section at the end summarizing key points

## PART 2: TEE TIME PICKS (add at the very end)
Add this exact section with 5 Spanish golf courses:

## Tee Time Picks

**[Course Name], [Region]**
[One sentence description] → [Book tee times](https://www.golfspain.com)

Include courses from: Costa del Sol, Costa Blanca, Mallorca, Barcelona area, or Canary Islands. Mix famous courses with hidden gems.

---

Return ONLY a JSON object:
{
  "subject": "Short catchy subject under 50 chars",
  "content": "Full newsletter in Markdown"
}

Example subject lines:
- "The science behind the perfect drive"
- "Why Valderrama is still Europe's best"
- "5 mistakes ruining your short game"`;

  try {
    const completion = await ai.client.chat.completions.create({
      model: ai.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const jsonBlock = extractJsonBlock(raw);

    let subject = `GolfSphere Weekly - ${formatDateForSubject()}`;
    let markdownContent = raw;

    if (jsonBlock) {
      try {
        const parsed = JSON.parse(jsonBlock);
        if (typeof parsed.subject === "string") subject = parsed.subject;
        if (typeof parsed.content === "string") markdownContent = parsed.content;
      } catch (error) {
        console.warn("[newsletter-agent] Failed to parse JSON output:", error);
      }
    }

    const htmlContent = markdownToHtml(markdownContent);
    const textContent = markdownContent
      .replace(/^#+\s*/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    console.log(`[newsletter-agent] Content generated (${ai.provider}): "${subject}"`);

    return {
      subject,
      htmlContent,
      textContent,
    };
  } catch (error) {
    console.error("[newsletter-agent] Failed to generate content:", error);
    return null;
  }
}

export async function runNewsletterAgent(): Promise<{ sent: number; failed: number } | null> {
  if (running) {
    console.log("[newsletter-agent] Previous run still in progress. Skipping.");
    return null;
  }

  running = true;
  console.log("[newsletter-agent] Starting newsletter generation...");

  try {
    // Get all active subscribers
    const subscribers = await storage.getAllSubscribers();
    const emails = subscribers.map((s) => s.email);

    if (emails.length === 0) {
      console.log("[newsletter-agent] No subscribers found. Skipping.");
      return { sent: 0, failed: 0 };
    }

    console.log(`[newsletter-agent] Found ${emails.length} subscribers`);

    // Generate newsletter content
    const content = await generateNewsletterContent();
    if (!content) {
      console.error("[newsletter-agent] Failed to generate newsletter content");
      return null;
    }

    // Send to all subscribers
    const result = await sendNewsletter(emails, content);
    console.log(`[newsletter-agent] Newsletter complete: ${result.sent} sent, ${result.failed} failed`);

    return result;
  } catch (error) {
    console.error("[newsletter-agent] Failed to run newsletter agent:", error);
    return null;
  } finally {
    running = false;
  }
}

export function startNewsletterAgent(): void {
  const enabled = process.env.NEWSLETTER_AGENT_ENABLED
    ? process.env.NEWSLETTER_AGENT_ENABLED === "true"
    : process.env.NODE_ENV === "production";

  if (!enabled) {
    console.log("[newsletter-agent] Disabled via NEWSLETTER_AGENT_ENABLED.");
    return;
  }

  const schedule = process.env.NEWSLETTER_AGENT_CRON || DEFAULT_CRON;
  const timeZone = process.env.NEWSLETTER_AGENT_TZ || DEFAULT_TIMEZONE;

  cron.schedule(
    schedule,
    () => {
      void runNewsletterAgent();
    },
    { timezone: timeZone }
  );

  console.log(`[newsletter-agent] Scheduled weekly run at "${schedule}" (${timeZone}).`);
}
