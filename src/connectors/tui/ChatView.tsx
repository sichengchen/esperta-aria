import React from "react";
import { Box, Text } from "ink";
import { MarkdownText } from "./MarkdownText.js";

export interface ChatMessage {
  role: "user" | "assistant" | "tool" | "error";
  content: string;
  toolName?: string;
}

interface ChatViewProps {
  messages: ChatMessage[];
  streamingText: string;
  agentName: string;
  height: number;
  scrollOffset: number;
}

export function ChatView({ messages, streamingText, agentName, height, scrollOffset }: ChatViewProps) {
  // Each message ≈ 2 rows (content + marginBottom), reserve 1 row for scroll indicator
  const maxVisible = Math.max(1, Math.floor((height - 1) / 2));
  const endIdx = messages.length - scrollOffset;
  const startIdx = Math.max(0, endIdx - maxVisible);
  const visibleMessages = messages.slice(startIdx, endIdx);
  const showStreaming = streamingText && scrollOffset === 0;

  return (
    <Box flexDirection="column" height={height}>
      {visibleMessages.map((msg, i) => (
        <Box key={startIdx + i} marginBottom={1}>
          <MessageBlock message={msg} agentName={agentName} />
        </Box>
      ))}
      {showStreaming && (
        <Box marginBottom={1}>
          <Text color="green" bold>
            {`${agentName}: `}
          </Text>
          <MarkdownText>{streamingText}</MarkdownText>
          <Text color="yellow">{"▊"}</Text>
        </Box>
      )}
      {scrollOffset > 0 && (
        <Text dimColor>{"↓ " + scrollOffset + " newer message" + (scrollOffset > 1 ? "s" : "") + " below"}</Text>
      )}
    </Box>
  );
}

function MessageBlock({ message, agentName }: { message: ChatMessage; agentName: string }) {
  switch (message.role) {
    case "user":
      return (
        <Box>
          <Text color="blue" bold>
            {"You: "}
          </Text>
          <Text>{message.content}</Text>
        </Box>
      );
    case "assistant":
      return (
        <Box>
          <Text color="green" bold>
            {`${agentName}: `}
          </Text>
          <MarkdownText>{message.content}</MarkdownText>
        </Box>
      );
    case "tool":
      return (
        <Box>
          <Text color="magenta" bold>
            {`[${message.toolName ?? "tool"}] `}
          </Text>
          <Text dimColor>{message.content}</Text>
        </Box>
      );
    case "error":
      return (
        <Box>
          <Text color="red" bold>
            {"Error: "}
          </Text>
          <Text color="red">{message.content}</Text>
        </Box>
      );
  }
}
