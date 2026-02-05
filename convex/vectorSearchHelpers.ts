import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Internal helpers for vector search (queries/mutations cannot use "use node")
export const getMessage = internalQuery({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const getUnembedded = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("messages").take(args.limit * 10);
    return messages.filter((m) => !m.embedding).slice(0, args.limit);
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
