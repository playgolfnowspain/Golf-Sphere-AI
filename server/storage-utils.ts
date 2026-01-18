/**
 * Utility function to initialize storage with database or fallback to mock
 * This centralizes the common initialization pattern used by both storage and chat storage
 */
export async function initializeStorageWithFallback<T>(
  options: {
    mockStorage: T;
    databaseStorageFactory: (db: any) => Promise<T> | T;
    logPrefix: string;
  }
): Promise<T> {
  const { mockStorage, databaseStorageFactory, logPrefix } = options;

  if (process.env.DATABASE_URL) {
    try {
      // Import database dependency
      const { db } = await import("./db");

      if (!db) {
        throw new Error("Database not initialized despite DATABASE_URL being set.");
      }

      const storage = await databaseStorageFactory(db);
      console.log(`[${logPrefix}] Using database storage`);
      return storage;
    } catch (error) {
      // Database connection failed, use mock storage
      console.log(
        `[${logPrefix}] Database connection failed, using mock storage:`,
        error instanceof Error ? error.message : error
      );
      return mockStorage;
    }
  } else {
    // No DATABASE_URL, use mock storage
    console.log(`[${logPrefix}] No DATABASE_URL set, using mock storage for development`);
    return mockStorage;
  }
}
