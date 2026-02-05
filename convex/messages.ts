import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

/**
 * Save a single message
 */
export const save = mutation({
  args: {
    platform: v.string(),
    groupId: v.string(),
    groupName: v.optional(v.string()),
    threadId: v.optional(v.string()),
    messageId: v.string(),
    content: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    authorRole: v.string(),
    timestamp: v.number(),
    replyToId: v.optional(v.string()),
    replyToText: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if message already exists (dedup)
    const existing = await ctx.db
      .query("messages")
      .withIndex("by_message_id", (q) =>
        q.eq("platform", args.platform).eq("messageId", args.messageId)
      )
      .first();
    
    if (existing) {
      // Update if content changed
      if (existing.content !== args.content) {
        await ctx.db.patch(existing._id, { content: args.content });
      }
      return null;
    }
    
    await ctx.db.insert("messages", args);
    return null;
  },
});

/**
 * Save multiple messages (batch)
 */
export const saveBatch = mutation({
  args: {
    messages: v.array(v.object({
      platform: v.string(),
      groupId: v.string(),
      groupName: v.optional(v.string()),
      threadId: v.optional(v.string()),
      messageId: v.string(),
      content: v.string(),
      authorId: v.string(),
      authorName: v.string(),
      authorRole: v.string(),
      timestamp: v.number(),
      replyToId: v.optional(v.string()),
      replyToText: v.optional(v.string()),
      metadata: v.optional(v.any()),
    })),
  },
  returns: v.number(), // count of new messages
  handler: async (ctx, args) => {
    let count = 0;
    for (const msg of args.messages) {
      const existing = await ctx.db
        .query("messages")
        .withIndex("by_message_id", (q) =>
          q.eq("platform", msg.platform).eq("messageId", msg.messageId)
        )
        .first();
      
      if (!existing) {
        await ctx.db.insert("messages", msg);
        count++;
      }
    }
    return count;
  },
});

/**
 * Get messages for a group
 */
export const getByGroup = query({
  args: {
    platform: v.string(),
    groupId: v.string(),
    threadId: v.optional(v.string()),
    limit: v.optional(v.number()),
    before: v.optional(v.number()), // timestamp
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("messages")
      .withIndex("by_platform_group", (q) =>
        q.eq("platform", args.platform).eq("groupId", args.groupId)
      );
    
    const messages = await q.order("desc").take(args.limit ?? 50);
    
    // Filter by thread if specified
    if (args.threadId) {
      return messages.filter(m => m.threadId === args.threadId);
    }
    
    return messages;
  },
});

/**
 * Search messages by content
 */
export const search = query({
  args: {
    query: v.string(),
    platform: v.optional(v.string()),
    groupId: v.optional(v.string()),
    authorId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Simple search - Convex doesn't have full-text search built-in
    // For now, filter in memory (works for small datasets)
    let messages = await ctx.db.query("messages").order("desc").take(1000);
    
    const queryLower = args.query.toLowerCase();
    
    return messages
      .filter(m => {
        if (args.platform && m.platform !== args.platform) return false;
        if (args.groupId && m.groupId !== args.groupId) return false;
        if (args.authorId && m.authorId !== args.authorId) return false;
        return m.content.toLowerCase().includes(queryLower);
      })
      .slice(0, args.limit ?? 20);
  },
});

/**
 * Get stats
 */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    
    const byPlatform: Record<string, number> = {};
    const byGroup: Record<string, number> = {};
    
    for (const m of messages) {
      byPlatform[m.platform] = (byPlatform[m.platform] || 0) + 1;
      const key = `${m.platform}:${m.groupId}`;
      byGroup[key] = (byGroup[key] || 0) + 1;
    }
    
    return {
      total: messages.length,
      byPlatform,
      byGroup,
      oldest: messages.length > 0 ? Math.min(...messages.map(m => m.timestamp)) : null,
      newest: messages.length > 0 ? Math.max(...messages.map(m => m.timestamp)) : null,
    };
  },
});
