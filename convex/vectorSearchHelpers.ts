import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Internal helpers for vector search (queries/mutations cannot use "use node")
export const getMessage = internalQuery({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

// Return IDs of messages that need embedding, scanning by timestamp
// afterTimestamp enables manual pagination from the caller
export const getUnembeddedIds = internalQuery({
  args: { limit: v.number(), afterTimestamp: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("messages").withIndex("by_timestamp");
    if (args.afterTimestamp !== undefined) {
      query = ctx.db.query("messages").withIndex("by_timestamp", q => q.gt("timestamp", args.afterTimestamp!));
    }
    // Take a chunk and filter
    const msgs = await query.take(args.limit * 3);
    return msgs
      .filter(m => !m.embedding && m.content)
      .slice(0, args.limit)
      .map(m => ({ _id: m._id, content: m.content, timestamp: m.timestamp }));
  },
});

// Keep old name for backwards compat
export const getUnembedded = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const msgs = await ctx.db.query("messages").withIndex("by_timestamp").take(args.limit * 3);
    return msgs
      .filter(m => !m.embedding && m.content)
      .slice(0, args.limit)
      .map(m => ({ _id: m._id, content: m.content, timestamp: m.timestamp }));
  },
});

export const updateEmbedding = internalMutation({
  args: {
    id: v.id("messages"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { embedding: args.embedding });
  },
});
