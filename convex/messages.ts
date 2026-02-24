import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

/**
 * Save a single message
 */
// Canonical groupId mapping - normalize on write
// NOTE: groupId field stores the value WITHOUT platform prefix
// Stats display as `${platform}:${groupId}` which can be confusing
function normalizeGroupId(_platform: string, groupId: string): string {
  const CANONICAL: Record<string, string> = {
    // === Telegram DM Kostya ===
    // Raw IDs
    "5211582231": "dm:kostya",
    // With redundant platform prefix
    "telegram:5211582231": "dm:kostya",
    "telegram:dm:5211582231": "dm:kostya",
    "telegram:telegram:5211582231": "dm:kostya",
    "telegram:main:5211582231": "dm:kostya",
    "telegram:telegram:dm:5211582231": "dm:kostya",
    "telegram:dm:kostya": "dm:kostya",
    // Name variants
    "Nezovskii": "dm:kostya",
    "telegram:Nezovskii": "dm:kostya",
    "kostya-dm": "dm:kostya",
    "telegram:kostya-dm": "dm:kostya",
    "dm-kostya": "dm:kostya",
    "telegram:dm-kostya": "dm:kostya",
    "main-dm": "dm:kostya",
    "telegram:main-dm": "dm:kostya",
    "direct": "dm:kostya",
    "telegram:direct": "dm:kostya",
    "dm": "dm:kostya",
    "telegram:dm": "dm:kostya",
    // Session variants  
    "main": "dm:kostya",
    "telegram:main": "dm:kostya",
    "main-session": "dm:kostya",
    "telegram:main-session": "dm:kostya",
    "agent-main": "dm:kostya",
    "telegram:agent-main": "dm:kostya",
    "agent-main-main": "dm:kostya",
    "telegram:agent-main-main": "dm:kostya",
    "agent:main:main": "dm:kostya",
    "telegram:agent:main:main": "dm:kostya",
    "agent:main:telegram:dm:5211582231": "dm:kostya",
    "telegram:agent:main:telegram:dm:5211582231": "dm:kostya",
    "system": "dm:kostya",
    "telegram:system": "dm:kostya",
    "dm:5211582231": "dm:kostya",

    // === K&D AI ===
    "-1002872167591": "group:kd-ai",
    "telegram:-1002872167591": "group:kd-ai",
    "g-1002872167591": "group:kd-ai",
    "telegram:g-1002872167591": "group:kd-ai",
    "g-k-d-ai-department": "group:kd-ai",
    "telegram:g-k-d-ai-department": "group:kd-ai",
    "k-d-ai-department": "group:kd-ai",
    "telegram:k-d-ai-department": "group:kd-ai",
    "kd-ai-department": "group:kd-ai",
    "telegram:kd-ai-department": "group:kd-ai",
    "K&D-AI-Department": "group:kd-ai",
    "telegram:K&D-AI-Department": "group:kd-ai",
    "telegram:group:kd-ai": "group:kd-ai",

    // === SUPERNATURAL ===
    "-1002652708441": "group:supernatural",
    "telegram:-1002652708441": "group:supernatural",
    "supernatural": "group:supernatural",
    "telegram:supernatural": "group:supernatural",
    "telegram:group:supernatural": "group:supernatural",
    // Topic 515
    "supernatural-515": "group:supernatural:515",
    "telegram:supernatural-515": "group:supernatural:515",
    "supernatural:515": "group:supernatural:515",
    "telegram:supernatural:515": "group:supernatural:515",
    "-1002652708441:515": "group:supernatural:515",
    "telegram:-1002652708441:515": "group:supernatural:515",
    "SUPERNATURAL-515": "group:supernatural:515",
    "telegram:SUPERNATURAL-515": "group:supernatural:515",
    "telegram:telegram:-1002652708441:515": "group:supernatural:515",
    "telegram:telegram:supernatural:515": "group:supernatural:515",
    "-1002652708441:topic:515": "group:supernatural:515",
    "telegram:-1002652708441:topic:515": "group:supernatural:515",
    "telegram:group:supernatural:515": "group:supernatural:515",

    // === AskStars ===
    "-5160239280": "group:askstars",
    "telegram:-5160239280": "group:askstars",
    "askstars": "group:askstars",
    "telegram:askstars": "group:askstars",
    "askstars:-5160239280": "group:askstars",
    "telegram:askstars:-5160239280": "group:askstars",
    "telegram:telegram:-5160239280": "group:askstars",
    "telegram:telegram:askstars:-5160239280": "group:askstars",
    "telegram:group:askstars": "group:askstars",

    // === WhatsApp Vadim ===
    "+17734303737": "dm:vadim",
    "whatsapp:+17734303737": "dm:vadim",
    "dm:+17734303737": "dm:vadim",
    "whatsapp:dm:+17734303737": "dm:vadim",
    "main:+17734303737": "dm:vadim",
    "whatsapp:main:+17734303737": "dm:vadim",
    "whatsapp:whatsapp:+17734303737": "dm:vadim",
    "whatsapp:dm:vadim": "dm:vadim",
    "vadim-dm": "dm:vadim",
    "whatsapp:vadim-dm": "dm:vadim",
    "vadim-chat": "dm:vadim",
    "whatsapp:vadim-chat": "dm:vadim",
    "vadim-demo": "dm:vadim",
    "whatsapp:vadim-demo": "dm:vadim",
    "vadim-actvox": "dm:vadim",
    "whatsapp:vadim-actvox": "dm:vadim",
    "dm-vadim": "dm:vadim",
    "whatsapp:dm-vadim": "dm:vadim",

    // === WhatsApp Kostya ===
    "+6282342471979": "dm:kostya",
    "whatsapp:+6282342471979": "dm:kostya",
    "whatsapp:dm:kostya": "dm:kostya",

    // === iMessage ===
    "nezovskii.info@gmail.com": "dm:kostya:imessage",
    "imessage:nezovskii.info@gmail.com": "dm:kostya:imessage",
    "telegram:nezovskii.info@gmail.com": "dm:kostya:imessage",

    // === Slack ===
    "C0AA8803J9Y": "ratx",
    "slack:C0AA8803J9Y": "ratx",
    "slack:ratx": "ratx",
    "ratx": "ratx",
    "slack:ratx-monitor": "ratx",
    "slack:slack:ratx-monitor": "ratx",
  };
  return CANONICAL[groupId] ?? groupId;
}

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
    const normalizedGroupId = normalizeGroupId(args.platform, args.groupId);
    const data = { ...args, groupId: normalizedGroupId };
    
    // Check if message already exists (dedup)
    const existing = await ctx.db
      .query("messages")
      .withIndex("by_message_id", (q) =>
        q.eq("platform", args.platform).eq("messageId", args.messageId)
      )
      .first();
    
    if (existing) {
      // Update if content changed or groupId needs normalizing
      const patch: Record<string, unknown> = {};
      if (existing.content !== args.content) patch.content = args.content;
      if (existing.groupId !== normalizedGroupId) patch.groupId = normalizedGroupId;
      if (Object.keys(patch).length > 0) await ctx.db.patch(existing._id, patch);
      return null;
    }
    
    await ctx.db.insert("messages", data);
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
      const normalizedGroupId = normalizeGroupId(msg.platform, msg.groupId);
      const data = { ...msg, groupId: normalizedGroupId };
      
      const existing = await ctx.db
        .query("messages")
        .withIndex("by_message_id", (q) =>
          q.eq("platform", msg.platform).eq("messageId", msg.messageId)
        )
        .first();
      
      if (!existing) {
        await ctx.db.insert("messages", data);
        count++;
      } else if (existing.groupId !== normalizedGroupId) {
        await ctx.db.patch(existing._id, { groupId: normalizedGroupId });
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
 * Normalize groupId across all messages
 * Maps all variant groupIds to canonical format
 */
export const normalizeGroupIds = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    mappings: v.any(),
  }),
  handler: async (ctx) => {
    const allMessages = await ctx.db.query("messages").collect();
    let updated = 0;
    const seenMappings: Record<string, string> = {};

    for (const msg of allMessages) {
      const canonical = normalizeGroupId(msg.platform, msg.groupId);
      if (canonical !== msg.groupId) {
        await ctx.db.patch(msg._id, { groupId: canonical });
        seenMappings[msg.groupId] = canonical;
        updated++;
      }
    }

    return { updated, mappings: seenMappings };
  },
});

/**
 * Get stats — sampled to avoid 16MB limit
 * Counts recent messages (last 10k) for breakdown, estimates total
 */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    // Get recent messages for stats breakdown (within 16MB limit)
    // Messages with embeddings are ~6KB each, so 2000 ≈ 12MB
    const recentMessages = await ctx.db
      .query("messages")
      .order("desc")
      .take(2000);
    
    const byPlatform: Record<string, number> = {};
    const byGroup: Record<string, number> = {};
    
    for (const m of recentMessages) {
      byPlatform[m.platform] = (byPlatform[m.platform] || 0) + 1;
      const key = `${m.platform}:${m.groupId}`;
      byGroup[key] = (byGroup[key] || 0) + 1;
    }
    
    // Get oldest message for range
    const oldestMessages = await ctx.db
      .query("messages")
      .order("asc")
      .take(1);
    
    const newest = recentMessages.length > 0 ? recentMessages[0].timestamp : null;
    const oldest = oldestMessages.length > 0 ? oldestMessages[0].timestamp : null;
    
    return {
      total: recentMessages.length,
      totalNote: recentMessages.length >= 2000 ? "2k+ (sampled)" : undefined,
      byPlatform,
      byGroup,
      oldest,
      newest,
    };
  },
});
