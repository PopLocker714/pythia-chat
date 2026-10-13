import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OutgoingMessage } from "./message";

type OutboxState = { messages: OutgoingMessage[] };
const initialState: OutboxState = { messages: [] };

export const outboxSlice = createSlice({
  name: "outbox",
  initialState,
  reducers: {
    sending(state, action: PayloadAction<OutgoingMessage>) {
      const index = state.messages.findIndex(
        (message) => message.clientMessageId === action.payload.clientMessageId,
      );
      if (index === -1) state.messages.push(action.payload);
      else state.messages[index] = action.payload;
    },
    failed(
      state,
      action: PayloadAction<{ clientMessageId: string; error: string }>,
    ) {
      const message = state.messages.find(
        (item) => item.clientMessageId === action.payload.clientMessageId,
      );
      if (message) {
        const index = state.messages.indexOf(message);
        state.messages[index] = {
          ...message,
          status: "failed",
          error: action.payload.error,
        };
      }
    },
    confirmed(state, action: PayloadAction<string[]>) {
      const confirmedIds = new Set(action.payload);
      state.messages = state.messages.filter(
        (message) => !confirmedIds.has(message.clientMessageId),
      );
    },
  },
});
