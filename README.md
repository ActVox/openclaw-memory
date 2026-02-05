# OpenClaw Memory

Convex backend for storing messages from all OpenClaw channels (Telegram, Slack, Discord, WhatsApp, iMessage).

## Setup

```bash
bun install
bun run dev
```

This will create a new Convex deployment and give you:
- Deployment URL: `https://xxx.convex.cloud`
- HTTP Actions URL: `https://xxx.convex.site`

## API

### Save Message
```bash
curl -X POST https://xxx.convex.site/messages \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "telegram",
    "groupId": "-1002872167591",
    "groupName": "K&D AI Department",
    "messageId": "295",
    "content": "Hello world",
    "authorId": "332455837",
    "authorName": "Оля💗",
    "authorRole": "user",
    "timestamp": 1770268291956
  }'
```

### Save Batch
```bash
curl -X POST https://xxx.convex.site/messages/batch \
  -H "Content-Type: application/json" \
  -d '{"messages": [...]}'
```

### Get Messages
```bash
curl "https://xxx.convex.site/messages?platform=telegram&groupId=-1002872167591&limit=50"
```

### Get Stats
```bash
curl https://xxx.convex.site/stats
```

## Schema

```typescript
messages: {
  platform: string,      // "telegram", "slack", "discord", etc
  groupId: string,       // Platform group identifier
  groupName?: string,    // Human-readable name
  threadId?: string,     // For threaded conversations
  messageId: string,     // Platform message ID
  content: string,       // Message text
  authorId: string,      // Platform user ID
  authorName: string,    // Display name
  authorRole: string,    // "user" | "assistant" | "system"
  timestamp: number,     // Unix ms
  replyToId?: string,    // Reply context
  replyToText?: string,  // Quoted text
  metadata?: any         // Platform-specific data
}
```

## Indexes

- `by_platform_group` - Fast lookup by platform + group
- `by_platform_group_thread` - Thread filtering
- `by_timestamp` - Chronological queries
- `by_author` - Find messages by author
- `by_message_id` - Deduplication

## Integration with OpenClaw

After deployment, add to TOOLS.md:
```markdown
## Convex Memory
- URL: https://xxx.convex.site
- Deployment: https://xxx.convex.cloud
```

The sync cron job will POST messages to `/messages/batch` every 10 minutes.
