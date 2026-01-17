import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { golfNow } from "../services/golfnow";
import { storage } from "../storage";

type AIProvider = "openai" | "perplexity";

// Build AI client supporting both OpenAI and Perplexity
function buildAiClient(): { client: OpenAI; provider: AIProvider; model: string } | null {
  const openaiApiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const openaiBaseUrl = process.env.OPENAI_BASE_URL || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1";
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  const perplexityBaseUrl = process.env.PERPLEXITY_BASE_URL || "https://api.perplexity.ai";

  const providerPreference = process.env.AI_PROVIDER;

  // Prefer Perplexity if configured and preferred
  if (providerPreference === "perplexity" && perplexityApiKey) {
    return {
      client: new OpenAI({ apiKey: perplexityApiKey, baseURL: perplexityBaseUrl }),
      provider: "perplexity",
      model: process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-large-128k-online",
    };
  }

  // Use OpenAI if configured and preferred
  if (providerPreference === "openai" && openaiApiKey) {
    return {
      client: new OpenAI({ apiKey: openaiApiKey, baseURL: openaiBaseUrl }),
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4o",
    };
  }

  // Fallback: try Perplexity first (good for real-time golf info), then OpenAI
  if (perplexityApiKey) {
    return {
      client: new OpenAI({ apiKey: perplexityApiKey, baseURL: perplexityBaseUrl }),
      provider: "perplexity",
      model: process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-large-128k-online",
    };
  }

  if (openaiApiKey) {
    return {
      client: new OpenAI({ apiKey: openaiApiKey, baseURL: openaiBaseUrl }),
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4o",
    };
  }

  return null;
}

const aiClient = buildAiClient();

if (aiClient) {
  console.log(`[chat] AI provider: ${aiClient.provider} (model: ${aiClient.model})`);
} else {
  console.warn("[chat] No AI provider configured. Set OPENAI_API_KEY or PERPLEXITY_API_KEY.");
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

  // Define functions available to the AI
  const functions = [
    {
      name: "search_golf_courses",
      description: "Search for available golf courses in Spain. Use this when the user asks about courses, wants to find courses in a location, or needs to see available options.",
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
      case "search_golf_courses": {
        const courses = await golfNow.searchCourses({
          location: args.location,
          courseName: args.courseName,
          date: args.date,
          players: args.players || 4,
        });
        return {
          courses: courses.map(c => ({
            id: c.id,
            name: c.name,
            location: c.location,
            region: c.region,
            price: c.price,
            currency: c.currency,
            rating: c.rating,
            description: c.description,
          })),
          count: courses.length,
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
      if (!aiClient) {
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
      
      // Build chat messages with system prompt
      const systemPrompt = `You are a helpful golf booking assistant for PlayGolfSpainNow. You help users find and book golf courses in Spain through GolfNow's booking platform. 

Key capabilities:
- Search for golf courses by location, name, or region
- Show available tee times for specific dates
- Book tee times directly when users confirm

When users want to book:
1. First search for courses if they haven't specified one
2. Show available tee times for their preferred date
3. Collect all required information: name, email, date, time, number of players
4. Confirm the booking details before booking
5. Book the tee time using the book_tee_time function

Always be friendly, helpful, and confirm important details before making bookings.`;

      const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";
      let needsFunctionCall = true;
      let iterationCount = 0;
      const maxIterations = 5; // Prevent infinite loops

      while (needsFunctionCall && iterationCount < maxIterations) {
        iterationCount++;
        
        // Perplexity doesn't support function calling, so use simple chat
        const usesFunctionCalling = aiClient.provider === "openai";
        
        const completion = await aiClient.client.chat.completions.create({
          model: aiClient.model,
          messages: chatMessages,
          ...(usesFunctionCalling ? { functions: functions, function_call: "auto" } : {}),
          stream: true,
          max_completion_tokens: 2048,
        });

        let functionCall: { name: string; arguments: string } | null = null;
        needsFunctionCall = false;
        let hasTextContent = false;
        const usesFunctionCalling = aiClient.provider === "openai";

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta;
          
          // Handle function calls (OpenAI only)
          if (usesFunctionCalling && delta?.function_call) {
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
          const content = delta?.content || "";
          if (content) {
            hasTextContent = true;
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        // Execute function if called (OpenAI only)
        if (usesFunctionCalling && functionCall && functionCall.name) {
          try {
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

      // Save assistant message
      if (fullResponse) {
        await chatStorage.createMessage(conversationId, "assistant", fullResponse);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

