import type { Conversation, Message } from "@shared/models/chat";

export interface IChatStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
}

// Mock chat storage for development when database is not available
class MockChatStorage implements IChatStorage {
  private conversations: Conversation[] = [];
  private messages: Message[] = [];
  private nextConversationId = 1;
  private nextMessageId = 1;

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.find(c => c.id === id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return [...this.conversations].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createConversation(title: string): Promise<Conversation> {
    const conversation: Conversation = {
      id: this.nextConversationId++,
      title,
      createdAt: new Date(),
    };
    this.conversations.push(conversation);
    return conversation;
  }

  async deleteConversation(id: number): Promise<void> {
    this.messages = this.messages.filter(m => m.conversationId !== id);
    this.conversations = this.conversations.filter(c => c.id !== id);
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return this.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<Message> {
    const message: Message = {
      id: this.nextMessageId++,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }
}

// Try to use database storage, fall back to mock if database is not available
let chatStorage: IChatStorage = new MockChatStorage();

async function initializeChatStorage(): Promise<IChatStorage> {
  const { initializeStorageWithFallback } = await import("../storage-utils");

  return initializeStorageWithFallback({
    mockStorage: new MockChatStorage(),
    logPrefix: "chat-storage",
    databaseStorageFactory: async (db) => {
      const { conversations, messages } = await import("@shared/schema");
      const { eq, desc } = await import("drizzle-orm");

      const storage: IChatStorage = {
        async getConversation(id: number) {
          const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
          return conversation;
        },

        async getAllConversations() {
          return db.select().from(conversations).orderBy(desc(conversations.createdAt));
        },

        async createConversation(title: string) {
          const [conversation] = await db.insert(conversations).values({ title }).returning();
          return conversation;
        },

        async deleteConversation(id: number) {
          // Messages are automatically deleted via cascade delete on the database
          await db.delete(conversations).where(eq(conversations.id, id));
        },

        async getMessagesByConversation(conversationId: number) {
          return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
        },

        async createMessage(conversationId: number, role: string, content: string) {
          const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
          return message;
        },
      };

      return storage;
    },
  });
}

// Initialize chat storage asynchronously
initializeChatStorage().then((storage) => {
  chatStorage = storage;
}).catch((err) => {
  console.error("[chat-storage] Failed to initialize:", err);
  chatStorage = new MockChatStorage();
});

export { chatStorage };

