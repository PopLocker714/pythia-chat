export type Sign = {
  kind: "sun" | "moon" | "rising";
  sign: string;
  caption: string;
};

type MessageIdentity = { id: string; created_at: string };

export type UserMessage = MessageIdentity & {
  role: "user";
  status: "done";
  client_message_id: string;
  text: string;
};

export type AssistantMessage = MessageIdentity & {
  role: "assistant";
  client_message_id: null;
} & (
    | { status: "generating"; text: null }
    | { status: "done"; text: string; signs?: Sign[] }
  );

export type ServerMessage = UserMessage | AssistantMessage;

export type OutgoingMessage = {
  clientMessageId: string;
  text: string;
  createdAt: string;
} & ({ status: "sending" } | { status: "failed"; error: string });

export type ChatMessage = ServerMessage | OutgoingMessage;

export function messageKey(message: ChatMessage): string {
  if ("clientMessageId" in message) return `user:${message.clientMessageId}`;
  return message.role === "user"
    ? `user:${message.client_message_id}`
    : `assistant:${message.id}`;
}

export const MAX_MESSAGE_LENGTH = 2000;

export function isValidMessageText(text: string): boolean {
  return text.trim().length > 0 && text.length <= MAX_MESSAGE_LENGTH;
}
