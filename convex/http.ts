import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * POST /messages - Save a single message
 * 
 * Body: {
 *   platform: string,
 *   groupId: string,
 *   groupName?: string,
 *   threadId?: string,
 *   messageId: string,
 *   content: string,
 *   authorId: string,
 *   authorName: string,
 *   authorRole: string,
 *   timestamp: number,
 *   replyToId?: string,
 *   replyToText?: string,
 *   metadata?: any
 * }
 */
http.route({
  path: "/messages",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      
      // Validate required fields
      const required = ["platform", "groupId", "messageId", "content", "authorId", "authorName", "authorRole", "timestamp"];
      for (const field of required) {
        if (!(field in body)) {
          return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      
      await ctx.runMutation(api.messages.save, body);
      
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error saving message:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

/**
 * POST /messages/batch - Save multiple messages
 * 
 * Body: {
 *   messages: Array<Message>
 * }
 */
http.route({
  path: "/messages/batch",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      
      if (!body.messages || !Array.isArray(body.messages)) {
        return new Response(JSON.stringify({ error: "Missing messages array" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const count = await ctx.runMutation(api.messages.saveBatch, { messages: body.messages });
      
      return new Response(JSON.stringify({ ok: true, saved: count }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error saving batch:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

/**
 * GET /messages?platform=telegram&groupId=-123&limit=50
 */
http.route({
  path: "/messages",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const platform = url.searchParams.get("platform");
      const groupId = url.searchParams.get("groupId");
      const threadId = url.searchParams.get("threadId");
      const limit = url.searchParams.get("limit");
      
      if (!platform || !groupId) {
        return new Response(JSON.stringify({ error: "platform and groupId required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const messages = await ctx.runQuery(api.messages.getByGroup, {
        platform,
        groupId,
        threadId: threadId || undefined,
        limit: limit ? parseInt(limit) : undefined,
      });
      
      return new Response(JSON.stringify(messages), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting messages:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

/**
 * GET /stats - Get message statistics
 */
http.route({
  path: "/stats",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const stats = await ctx.runQuery(api.messages.stats, {});
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting stats:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
