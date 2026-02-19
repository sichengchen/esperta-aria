import { Bot } from "grammy";
import type { Agent } from "../agent/index.js";
import { splitMessage, formatToolResult } from "./formatter.js";

const EDIT_THROTTLE_MS = 1000;

export interface TelegramTransportOptions {
  botToken: string;
  agent: Agent;
  allowedChatId?: number;
}

export class TelegramTransport {
  private bot: Bot;
  private agent: Agent;
  private allowedChatId?: number;

  constructor(options: TelegramTransportOptions) {
    this.bot = new Bot(options.botToken);
    this.agent = options.agent;
    this.allowedChatId = options.allowedChatId;
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.bot.on("message:text", async (ctx) => {
      // Security: restrict to allowed chat ID
      if (
        this.allowedChatId !== undefined &&
        ctx.message.chat.id !== this.allowedChatId
      ) {
        return;
      }

      const userText = ctx.message.text;

      // Send initial "thinking" message
      let sentMsg = await ctx.reply("...");
      let fullText = "";
      let lastEditTime = 0;

      try {
        for await (const event of this.agent.chat(userText)) {
          switch (event.type) {
            case "text_delta":
              fullText += event.delta;
              // Throttle edits to avoid Telegram rate limits
              if (Date.now() - lastEditTime > EDIT_THROTTLE_MS && fullText.length > 0) {
                try {
                  await ctx.api.editMessageText(
                    ctx.message.chat.id,
                    sentMsg.message_id,
                    fullText.slice(0, 4096)
                  );
                  lastEditTime = Date.now();
                } catch {
                  // Edit may fail if content unchanged — ignore
                }
              }
              break;

            case "tool_end": {
              const toolMsg = formatToolResult(event.name, event.result.content);
              try {
                await ctx.reply(toolMsg, { parse_mode: "MarkdownV2" });
              } catch {
                // Fallback to plain text if markdown fails
                await ctx.reply(`[${event.name}] ${event.result.content.slice(0, 500)}`);
              }
              break;
            }

            case "done":
              // Final edit with complete text
              if (fullText) {
                const chunks = splitMessage(fullText);
                try {
                  await ctx.api.editMessageText(
                    ctx.message.chat.id,
                    sentMsg.message_id,
                    chunks[0]
                  );
                } catch {
                  // ignore
                }
                // Send additional chunks as new messages
                for (let i = 1; i < chunks.length; i++) {
                  await ctx.reply(chunks[i]);
                }
              }
              break;

            case "error":
              await ctx.reply(`⚠️ Error: ${event.message}`);
              break;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await ctx.reply(`⚠️ Error: ${msg}`);
      }
    });

    this.bot.catch((err) => {
      console.error("Telegram bot error:", err);
    });
  }

  async start(): Promise<void> {
    await this.bot.start({
      onStart: (botInfo) => {
        console.log(`Telegram bot @${botInfo.username} started`);
      },
    });
  }

  async stop(): Promise<void> {
    await this.bot.stop();
  }

  isRunning(): boolean {
    return this.bot.isRunning();
  }
}
