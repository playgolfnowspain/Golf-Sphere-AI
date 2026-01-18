import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { golfNow } from "../services/golfnow";
import { storage } from "../storage";

// Initialize OpenAI client for conversation and function calling
const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    })
  : null;

// Initialize Perplexity client for real-time web search
const perplexityClient = process.env.PERPLEXITY_API_KEY
  ? new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: process.env.PERPLEXITY_BASE_URL || "https://api.perplexity.ai",
    })
  : null;

// Log available AI providers
if (openaiClient) {
  console.log("[chat] OpenAI configured for conversation & function calling");
}
if (perplexityClient) {
  console.log("[chat] Perplexity configured for real-time golf search");
}
if (!openaiClient && !perplexityClient) {
  console.warn("[chat] No AI provider configured. Set OPENAI_API_KEY and/or PERPLEXITY_API_KEY.");
}

// Perplexity search for real-time golf information
async function searchGolfInfoWithPerplexity(query: string): Promise<string> {
  if (!perplexityClient) {
    return "Real-time search not available (Perplexity not configured)";
  }

  try {
    console.log(`[Perplexity] Searching: ${query}`);
    const response = await perplexityClient.chat.completions.create({
      model: process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: "system",
          content: `You are a golf research assistant specializing in Spanish golf courses.
Provide accurate, up-to-date information about golf courses in Spain, focusing on:
- Current green fees and prices
- Course ratings and reviews
- Facilities and amenities
- Contact information
- Best times to play
- Weather conditions
Be concise but thorough. Include specific details when available.`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      max_tokens: 1024,
    });

    const result = response.choices[0]?.message?.content || "No results found";
    console.log(`[Perplexity] Search complete: ${result.substring(0, 100)}...`);
    return result;
  } catch (error) {
    console.error("[Perplexity] Search error:", error);
    return "Search temporarily unavailable";
  }
}

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Define functions available to the AI (OpenAI function calling)
  const functions = [
    {
      name: "web_search_golf",
      description: "Search the web for real-time golf information using Perplexity AI. Use this for: current prices, latest reviews, weather forecasts, course conditions, recent news, or any information that needs to be up-to-date. This searches the internet for the most current information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query for golf information (e.g., 'current green fees at Valderrama golf course 2024', 'best golf courses Costa del Sol reviews', 'weather forecast Marbella golf this week')",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "search_golf_courses",
      description: "Search our database for available golf courses in Spain. Use this when the user asks about courses, wants to find courses in a location, or needs to see available options for booking.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "Location or region to search (e.g., 'Costa del Sol', 'Sotogrande', 'Barcelona')",
          },
          courseName: {
            type: "string",
            description: "Specific course name if mentioned",
          },
          date: {
            type: "string",
            description: "Date for tee time in YYYY-MM-DD format",
          },
          players: {
            type: "number",
            description: "Number of players (default 4)",
          },
        },
      },
    },
    {
      name: "get_tee_times",
      description: "Get available tee times for a specific course and date. Use this after finding a course the user likes.",
      parameters: {
        type: "object",
        properties: {
          courseId: {
            type: "string",
            description: "The course ID (from search results)",
          },
          date: {
            type: "string",
            description: "Date for tee time in YYYY-MM-DD format",
          },
          players: {
            type: "number",
            description: "Number of players",
          },
        },
        required: ["courseId", "date"],
      },
    },
    {
      name: "book_tee_time",
      description: "Book a tee time for the user. Use this when the user confirms they want to book. You MUST collect all required information: course name, date, time, number of players, user name, and email before calling this function.",
      parameters: {
        type: "object",
        properties: {
          courseId: {
            type: "string",
            description: "The course ID to book",
          },
          courseName: {
            type: "string",
            description: "Full name of the course",
          },
          playDate: {
            type: "string",
            description: "Date for tee time in YYYY-MM-DD format",
          },
          teeTime: {
            type: "string",
            description: "Tee time in HH:MM format (e.g., '08:00', '14:30')",
          },
          playerCount: {
            type: "number",
            description: "Number of players",
          },
          userName: {
            type: "string",
            description: "Full name of the person making the booking",
          },
          userEmail: {
            type: "string",
            description: "Email address of the person making the booking",
          },
        },
        required: ["courseId", "courseName", "playDate", "teeTime", "playerCount", "userName", "userEmail"],
      },
    },
  ];

  // Function implementations
  async function executeFunction(name: string, args: any): Promise<any> {
    switch (name) {
      case "web_search_golf": {
        // Use Perplexity for real-time web search
        const searchResult = await searchGolfInfoWithPerplexity(args.query);
        return {
          source: "perplexity_web_search",
          query: args.query,
          result: searchResult,
        };
      }
      case "search_golf_courses": {
        const courses = await golfNow.searchCourses({
          location: args.location,
          courseName: args.courseName,
          date: args.date,
          players: args.players || 4,
        });
        return {
          source: "internal_database",
          courses: courses.map(c => ({
            id: c.id,
            name: c.name,
            location: c.location,
            region: c.region,
            price: c.price,
            currency: c.currency,
            rating: c.rating,
            description: c.description,
            bookingUrl: c.affiliateUrl || `https://www.greenfee365.com/en/golf-club/spain/${c.id}`,
          })),
          count: courses.length,
          note: "IMPORTANT: Always include the bookingUrl as a clickable link for each course in your response.",
        };
      }
      case "get_tee_times": {
        const slots = await golfNow.getAvailableTeeTimes(
          args.courseId,
          args.date,
          args.players || 4
        );
        const course = await golfNow.getCourseById(args.courseId);
        return {
          courseName: course?.name || "Unknown",
          date: args.date,
          teeTimes: slots.map(slot => ({
            time: slot.time,
            price: slot.price,
            currency: course?.currency || "EUR",
            available: slot.available,
          })),
        };
      }
      case "book_tee_time": {
        try {
          const booking = await golfNow.bookTeeTime({
            courseId: args.courseId,
            courseName: args.courseName,
            playDate: args.playDate,
            teeTime: args.teeTime,
            playerCount: args.playerCount,
            userName: args.userName,
            userEmail: args.userEmail,
          });

          // Save booking to database
          await storage.createBooking({
            courseName: args.courseName,
            playDate: args.playDate,
            teeTime: args.teeTime,
            playerCount: args.playerCount,
            userName: args.userName,
            userEmail: args.userEmail,
          });

          return {
            success: true,
            bookingId: booking.bookingId,
            confirmationNumber: booking.confirmationNumber,
            courseName: booking.courseName,
            playDate: booking.playDate,
            teeTime: booking.teeTime,
            totalPrice: booking.totalPrice,
            currency: booking.currency,
            status: booking.status,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Booking failed",
          };
        }
      }
      default:
        return { error: `Unknown function: ${name}` };
    }
  }

  // Send message and get AI response (streaming with function calling)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      // Require at least one AI provider
      if (!openaiClient && !perplexityClient) {
        return res.status(503).json({
          error: "Chat AI not available. Please configure OPENAI_API_KEY or PERPLEXITY_API_KEY."
        });
      }

      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);

      // Build system prompt
      const systemPrompt = `You are a helpful golf booking assistant for PlayGolfSpainNow. You help users find and book golf courses in Spain.

KEY CAPABILITIES:
1. **Web Search (Perplexity)**: Use web_search_golf for real-time info like current prices, reviews, weather, course conditions, or any up-to-date information.
2. **Course Database**: Use search_golf_courses to find courses available for booking in our system.
3. **Tee Times**: Use get_tee_times to check availability for a specific course.
4. **Booking**: Use book_tee_time to complete a booking (requires all user details).

WHEN TO USE EACH:
- User asks "what are the best courses?" → Use web_search_golf for current reviews/rankings
- User asks "what courses can I book?" → Use search_golf_courses for our database
- User asks "how much is Valderrama?" → Use web_search_golf for current pricing
- User asks "show me tee times for tomorrow" → Use search_golf_courses then get_tee_times
- User wants to book → Collect details, then use book_tee_time

BOOKING FLOW:
1. Search courses or get info user needs
2. Show available tee times for their date
3. Collect: name, email, date, time, number of players
4. Confirm details before booking
5. Complete booking with book_tee_time

IMPORTANT - ALWAYS INCLUDE BOOKING LINKS:
When mentioning ANY golf course, ALWAYS include a clickable booking link in this format:
- [Course Name - Book Now](booking_url)

Example response format:
"Here are some great courses in Costa del Sol:

1. **Real Club Valderrama** - €350 - Rating: 4.9/5
   One of Europe's most prestigious courses.
   [Book Valderrama Now](https://www.greenfee365.com/course/valderrama)

2. **Finca Cortesin** - €280 - Rating: 4.8/5
   Luxury resort with impeccable conditions.
   [Book Finca Cortesin](https://www.greenfee365.com/course/finca-cortesin)"

If the course data includes an affiliateUrl or bookingUrl, use that. Otherwise, construct a link to greenfee365.com/course/[course-name-slug].

Be friendly, helpful, and proactive. If information seems outdated, use web_search_golf to get current data.`;

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";

      // Use OpenAI if available (supports function calling), otherwise fallback to Perplexity
      if (openaiClient) {
        // OpenAI with function calling
        const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        let needsFunctionCall = true;
        let iterationCount = 0;
        const maxIterations = 5;

        while (needsFunctionCall && iterationCount < maxIterations) {
          iterationCount++;

          const completion = await openaiClient.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o",
            messages: chatMessages,
            functions: functions,
            function_call: "auto",
            stream: true,
            max_completion_tokens: 2048,
          });

          let functionCall: { name: string; arguments: string } | null = null;
          needsFunctionCall = false;

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;

            // Handle function calls
            if (delta?.function_call) {
              needsFunctionCall = true;
              if (!functionCall) {
                functionCall = {
                  name: delta.function_call.name || "",
                  arguments: delta.function_call.arguments || "",
                };
              } else {
                if (delta.function_call.name) functionCall.name = delta.function_call.name;
                if (delta.function_call.arguments) {
                  functionCall.arguments += delta.function_call.arguments;
                }
              }
            }

            // Handle text content
            const textContent = delta?.content || "";
            if (textContent) {
              fullResponse += textContent;
              res.write(`data: ${JSON.stringify({ content: textContent })}\n\n`);
            }
          }

          // Execute function if called
          if (functionCall && functionCall.name) {
            try {
              // Notify client that we're searching
              if (functionCall.name === "web_search_golf") {
                res.write(`data: ${JSON.stringify({ status: "searching", message: "Searching for latest golf information..." })}\n\n`);
              }

              const args = JSON.parse(functionCall.arguments);
              const functionResult = await executeFunction(functionCall.name, args);

              // Add function call and result to conversation
              chatMessages.push({
                role: "assistant",
                content: null,
                function_call: {
                  name: functionCall.name,
                  arguments: functionCall.arguments,
                },
              });

              chatMessages.push({
                role: "function",
                name: functionCall.name,
                content: JSON.stringify(functionResult),
              });

              // Special handling for booking confirmations
              if (functionCall.name === "book_tee_time" && functionResult.success) {
                const confirmationMsg = `\n\n✅ **Booking Confirmed!**\n\n**Confirmation Number:** ${functionResult.confirmationNumber}\n**Course:** ${functionResult.courseName}\n**Date:** ${functionResult.playDate}\n**Time:** ${functionResult.teeTime}\n**Total:** ${functionResult.totalPrice} ${functionResult.currency}\n\nYour booking confirmation has been sent to ${args.userEmail}. Enjoy your round!`;
                fullResponse += confirmationMsg;
                res.write(`data: ${JSON.stringify({ content: confirmationMsg })}\n\n`);
                needsFunctionCall = false;
              }
            } catch (error) {
              console.error("Function execution error:", error);
              chatMessages.push({
                role: "function",
                name: functionCall.name,
                content: JSON.stringify({ error: "Function execution failed" }),
              });
            }
          } else {
            needsFunctionCall = false;
          }
        }
      } else if (perplexityClient) {
        // Fallback: Perplexity only (no function calling, but good for search)
        const chatMessages = [
          {
            role: "system" as const,
            content: `You are a helpful golf assistant for PlayGolfSpainNow. Help users find information about golf courses in Spain. You have access to real-time web search, so provide current and accurate information about courses, prices, reviews, and availability. Be friendly and helpful.`
          },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        const completion = await perplexityClient.chat.completions.create({
          model: process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-large-128k-online",
          messages: chatMessages,
          stream: true,
          max_tokens: 2048,
        });

        for await (const chunk of completion) {
          const textContent = chunk.choices[0]?.delta?.content || "";
          if (textContent) {
            fullResponse += textContent;
            res.write(`data: ${JSON.stringify({ content: textContent })}\n\n`);
          }
        }
      }

      // Save assistant message
      if (fullResponse) {
        await chatStorage.createMessage(conversationId, "assistant", fullResponse);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  // Health check endpoint for AI status
  app.get("/api/chat/status", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      providers: {
        openai: !!openaiClient,
        perplexity: !!perplexityClient,
      },
      capabilities: {
        functionCalling: !!openaiClient,
        webSearch: !!perplexityClient,
        booking: !!openaiClient,
      },
    });
  });
}
