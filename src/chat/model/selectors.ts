import { createSelector } from "@reduxjs/toolkit";
import { type ChatApi, emptyHistory } from "../api/chat-api";
import type { ChatMessage } from "./message";
import type { ChatState } from "./store";

export function createChatSelectors(api: ChatApi) {
  const selectHistoryQuery = api.endpoints.history.select();
  const selectHistory = createSelector(
    selectHistoryQuery,
    (query) => query.data ?? emptyHistory,
  );
  const selectOutbox = (state: ChatState) => state.outbox.messages;
  const selectGenerating = createSelector(selectHistory, (history) =>
    history.ids.filter((id) => history.entities[id]?.status === "generating"),
  );
  const selectMessages = createSelector(
    selectHistory,
    selectOutbox,
    (history, outbox): ChatMessage[] => {
      const messages: ChatMessage[] = [];
      const confirmedIds = new Set<string>();
      for (const id of history.ids) {
        const message = history.entities[id];
        if (!message) continue;
        messages.push(message);
        if (message.role === "user")
          confirmedIds.add(message.client_message_id);
      }
      for (const message of outbox) {
        if (!confirmedIds.has(message.clientMessageId)) messages.push(message);
      }
      return messages;
    },
  );
  const selectCanSend = createSelector(
    selectHistoryQuery,
    selectOutbox,
    selectGenerating,
    (query, outbox, generating) =>
      query.isSuccess &&
      !query.isLoading &&
      outbox.length === 0 &&
      generating.length === 0,
  );
  const selectCanRetry = createSelector(
    selectHistoryQuery,
    selectOutbox,
    selectGenerating,
    (query, outbox, generating) =>
      query.isSuccess &&
      !query.isLoading &&
      !outbox.some((message) => message.status === "sending") &&
      generating.length === 0,
  );
  return {
    selectHistory,
    selectMessages,
    selectGenerating,
    selectCanSend,
    selectCanRetry,
  };
}
