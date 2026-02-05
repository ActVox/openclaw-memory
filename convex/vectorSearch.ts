import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Semantic search across all messages
 */
export const search = action({
  args: {
    query: v.string(),
    platform: v.optional(v.string()),
    groupId: v.optional(v.string()),
    authorId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get embedding for query
    const embedding = await getEmbedding(args.query);
    
    // Build filter
    const filter: Record<string, string> = {};
    if (args.platform) filter.platform = args.platform;
    if (args.groupId) filter.groupId = args.groupId;
    if (args.authorId) filter.authorId = args.authorId;
    
    // Vector search
    const results = await ctx.vectorSearch("messages", "by_embedding", {
      vector: embedding,
      limit: args.limit ?? 10,
      filter: Object.keys(filter).length > 0 
        ? (q) => {
            let f = q;
            if (filter.platform) f = f.eq("platform", filter.platform);
            if (filter.groupId) f = f.eq("groupId", filter.groupId);
            if (filter.authorId) f = f.eq("authorId", filter.authorId);
            return f;
          }
        : undefined,
    });
    
    // Fetch full documents
    const messages = await Promise.all(
      results.map(async (r) => {
        const doc = await ctx.runQuery(internal.vectorSearch.getMessage, { id: r._id });
        return { ...doc, _score: r._score };
      })
    );
    
    return messages.filter(Boolean);
  },
});

/**
 * Generate embedding for a message and store it
 */
export const embedMessage = action({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.runQuery(internal.vectorSearch.getMessage, { id: args.messageId });
    if (!message || message.embedding) return; // Skip if already embedded
    
    const embedding = await getEmbedding(message.content);
    await ctx.runMutation(internal.vectorSearch.updateEmbedding, {
      id: args.messageId,
      embedding,
    });
  },
});

/**
 * Batch embed all messages without embeddings
 */
export const embedAll = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.runQuery(internal.vectorSearch.getUnembedded, { 
      limit: args.limit ?? 100 
    });
    
    let count = 0;
    for (const msg of messages) {
      const embedding = await getEmbedding(msg.content);
      await ctx.runMutation(internal.vectorSearch.updateEmbedding, {
        id: msg._id,
        embedding,
      });
      count++;
    }
    
    return { embedded: count };
  },
});

// Internal helpers
export const getMessage = internalQuery({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const getUnembedded = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("messages").take(args.limit * 10);
    return messages.filter(m => !m.embedding).slice(0, args.limit);
  },
});

export const updateEmbedding = internalMutation({
  args: { 
    id: v.id("messages"), 
    embedding: v.array(v.float64()) 
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { embedding: args.embedding });
  },
});

// Get embedding from OpenAI
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000), // Truncate to fit
    }),
  });
  
  const data = await response.json();
  return data.data[0].embedding;
}

// Need to add to convex.config.ts or set in Convex dashboard:
// OPENAI_API_KEY
