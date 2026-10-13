import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import type { ChatApi } from "../api/chat-api";
import { outboxSlice } from "./outbox";

export function createChatStore(api: ChatApi) {
  const listener = createListenerMiddleware();
  const store = configureStore({
    reducer: { outbox: outboxSlice.reducer, chatApi: api.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(listener.middleware)
        .concat(api.middleware),
  });
  return { store, listener };
}

export type ChatStore = ReturnType<typeof createChatStore>["store"];
export type ChatState = ReturnType<ChatStore["getState"]>;
