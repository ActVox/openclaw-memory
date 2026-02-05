"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
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
  handler: async (ctx, args): Promise<Array<Record<string, unknown>>> => {
    // Get embedding for query
    const embedding = await getEmbedding(args.query);
    const searchLimit = (args.limit ?? 10) * 3; // Fetch more for post-filtering

    // Vector search with optional single-field filter
    // Convex vector search supports one filter at a time, so we pick most specific
    let results;
    if (args.authorId) {
      results = await ctx.vectorSearch("messages", "by_embedding", {
        vector: embedding,
        limit: searchLimit,
        filter: (q) => q.eq("authorId", args.authorId!),
      });
    } else if (args.groupId) {
      results = await ctx.vectorSearch("messages", "by_embedding", {
        vector: embedding,
        limit: searchLimit,
        filter: (q) => q.eq("groupId", args.groupId!),
      });
    } else if (args.platform) {
      results = await ctx.vectorSearch("messages", "by_embedding", {
        vector: embedding,
        limit: searchLimit,
        filter: (q) => q.eq("platform", args.platform!),
      });
    } else {
      results = await ctx.vectorSearch("messages", "by_embedding", {
        vector: embedding,
        limit: searchLimit,
      });
    }

    // Fetch full documents
    const messages: Array<Record<string, unknown> & { _score: number }> = [];
    for (const r of results) {
      const doc = await ctx.runQuery(internal.vectorSearchHelpers.getMessage, {
        id: r._id,
      });
      if (doc) {
        messages.push({ ...doc, _score: r._score });
      }
    }

    // Post-filter for additional conditions not covered by vector filter
    const filtered = messages.filter((msg) => {
      if (args.platform && msg.platform !== args.platform) return false;
      if (args.groupId && msg.groupId !== args.groupId) return false;
      if (args.authorId && msg.authorId !== args.authorId) return false;
      return true;
    });

    return filtered.slice(0, args.limit ?? 10);
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
    const message = await ctx.runQuery(
      internal.vectorSearchHelpers.getMessage,
      { id: args.messageId }
    );
    if (!message || message.embedding) return; // Skip if already embedded

    const embedding = await getEmbedding(message.content);
    await ctx.runMutation(internal.vectorSearchHelpers.updateEmbedding, {
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
    const messages = await ctx.runQuery(
      internal.vectorSearchHelpers.getUnembedded,
      {
        limit: args.limit ?? 100,
      }
    );

    let count = 0;
    for (const msg of messages) {
      const embedding = await getEmbedding(msg.content);
      await ctx.runMutation(internal.vectorSearchHelpers.updateEmbedding, {
        id: msg._id,
        embedding,
      });
      count++;
    }

    return { embedded: count };
  },
});

// Get embedding from OpenAI
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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

// Set OPENAI_API_KEY in Convex dashboard
