import { describe, test, expect } from "bun:test";
import {
  formatToolResult,
  splitMessage,
  escapeMarkdown,
} from "../src/telegram/index.js";

describe("Telegram formatter", () => {
  describe("escapeMarkdown", () => {
    test("escapes special characters", () => {
      const result = escapeMarkdown("hello_world*bold*");
      expect(result).toBe("hello\\_world\\*bold\\*");
    });

    test("handles no special chars", () => {
      expect(escapeMarkdown("plain text")).toBe("plain text");
    });
  });

  describe("formatToolResult", () => {
    test("formats tool result with code block", () => {
      const result = formatToolResult("bash", "hello world");
      expect(result).toContain("bash");
      expect(result).toContain("hello world");
      expect(result).toContain("```");
    });

    test("truncates long content", () => {
      const long = "x".repeat(600);
      const result = formatToolResult("read", long);
      expect(result.length).toBeLessThan(600);
      expect(result).toContain("…");
    });
  });

  describe("splitMessage", () => {
    test("returns single chunk for short message", () => {
      const chunks = splitMessage("hello");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe("hello");
    });

    test("splits long messages", () => {
      const long = "a".repeat(5000);
      const chunks = splitMessage(long);
      expect(chunks.length).toBeGreaterThan(1);
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(4096);
      }
      expect(chunks.join("")).toBe(long);
    });

    test("prefers splitting at newlines", () => {
      const text = "a".repeat(3000) + "\n" + "b".repeat(2000);
      const chunks = splitMessage(text);
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBe("a".repeat(3000));
      expect(chunks[1]).toBe("b".repeat(2000));
    });
  });
});
