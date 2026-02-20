const DISCORD_MAX_LENGTH = 2000;

/** Format tool result for Discord display */
export function formatToolResult(toolName: string, content: string): string {
  const truncated = content.length > 500 ? content.slice(0, 500) + "..." : content;
  return `**${toolName}**\n\`\`\`\n${truncated}\n\`\`\``;
}

/** Split a long message into chunks fitting Discord's 2000 char limit */
export function splitMessage(text: string): string[] {
  if (text.length <= DISCORD_MAX_LENGTH) return [text];

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= DISCORD_MAX_LENGTH) {
      chunks.push(remaining);
      break;
    }
    let breakAt = remaining.lastIndexOf("\n", DISCORD_MAX_LENGTH);
    if (breakAt === -1 || breakAt < DISCORD_MAX_LENGTH / 2) {
      breakAt = DISCORD_MAX_LENGTH;
    }
    chunks.push(remaining.slice(0, breakAt));
    remaining = remaining[breakAt] === "\n"
      ? remaining.slice(breakAt + 1)
      : remaining.slice(breakAt);
  }
  return chunks;
}
