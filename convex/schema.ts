import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // All messages from all sources
  messages: defineTable({
    // Source info
    platform: v.string(),           // "telegram", "slack", "discord", "whatsapp", "imessage"
    groupId: v.string(),            // "-1002872167591", "C0AA8803J9Y", etc
    groupName: v.optional(v.string()), // "K&D AI Department", "#ratx"
    threadId: v.optional(v.string()), // For threaded platforms (Slack threads, TG topics)
    
    // Message info
    messageId: v.string(),          // Platform-specific message ID
    content: v.string(),            // Message text
    
    // Author info
    authorId: v.string(),           // Platform user ID
    authorName: v.string(),         // Display name
    authorRole: v.string(),         // "user", "assistant", "system"
    
    // Timestamps
    timestamp: v.number(),          // Unix ms
    
    // Reply context
    replyToId: v.optional(v.string()), // If replying to another message
    replyToText: v.optional(v.string()), // Quoted text snippet
    
    // Metadata
    metadata: v.optional(v.any()),  // Platform-specific extras
  })
    .index("by_platform_group", ["platform", "groupId"])
    .index("by_platform_group_thread", ["platform", "groupId", "threadId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_author", ["platform", "authorId"])
    .index("by_message_id", ["platform", "messageId"]),
    
  // Track sync state per source
  syncState: defineTable({
    platform: v.string(),
    groupId: v.string(),
    lastMessageId: v.optional(v.string()),
    lastTimestamp: v.number(),
    lastSyncAt: v.number(),
  })
    .index("by_platform_group", ["platform", "groupId"]),
});
