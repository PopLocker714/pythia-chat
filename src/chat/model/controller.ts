import { type ChatApi, messagesAdapter } from "../api/chat-api";
import { POLL_ERROR_DELAY_MS } from "../api/retry-after";
import type { Clock } from "./clock";
import {
  isValidMessageText,
  type OutgoingMessage,
  type ServerMessage,
} from "./message";
import { outboxSlice } from "./outbox";
import { createChatSelectors } from "./selectors";
import type { ChatStore } from "./store";

type Dependencies = {
  api: ChatApi;
  store: ChatStore;
  clock: Clock;
  createId(): string;
};

export function createChatController({
  api,
  store,
  clock,
  createId,
}: Dependencies) {
  const selectors = createChatSelectors(api);
  const deadlines = new Map<string, number>();
  const running = new Map<string, AbortController>();
  let active = false;

  function mergeMessages(messages: ServerMessage[]) {
    store.dispatch(
      api.util.updateQueryData("history", undefined, (history) => {
        for (const message of messages) {
          if (history.entities[message.id]?.status === "done") continue;
          messagesAdapter.upsertOne(history, message);
        }
      }),
    );
  }

  async function poll(id: string, signal: AbortSignal) {
    while (!signal.aborted) {
      await clock.waitUntil(
        deadlines.get(id) ?? clock.now() + POLL_ERROR_DELAY_MS,
        signal,
      );
      if (signal.aborted) return;
      const request = store.dispatch(
        api.endpoints.reply.initiate(id, {
          forceRefetch: true,
          subscribe: false,
        }),
      );
      const abort = () => request.abort();
      signal.addEventListener("abort", abort, { once: true });
      const result = await request;
      signal.removeEventListener("abort", abort);
      if (signal.aborted) return;
      if (result.data && !result.error) {
        mergeMessages([result.data.message]);
        if (result.data.message.status === "done") {
          deadlines.delete(id);
          return;
        }
        deadlines.set(id, result.data.nextPollAt);
      } else {
        const error = result.error;
        const nextPollAt =
          error && "nextPollAt" in error
            ? error.nextPollAt
            : clock.now() + POLL_ERROR_DELAY_MS;
        deadlines.set(id, nextPollAt);
      }
    }
  }

  function ensurePolling(id: string) {
    if (!active || running.has(id)) return;
    const controller = new AbortController();
    running.set(id, controller);
    void poll(id, controller.signal)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Reply polling stopped unexpectedly", error);
          deadlines.set(id, clock.now() + POLL_ERROR_DELAY_MS);
        }
      })
      .finally(() => {
        if (running.get(id) === controller) running.delete(id);
        if (active && deadlines.has(id)) ensurePolling(id);
      });
  }

  function reconcileHistory() {
    const history = selectors.selectHistory(store.getState());
    const confirmed: string[] = [];
    for (const id of history.ids) {
      const message = history.entities[id];
      if (message?.role === "user") confirmed.push(message.client_message_id);
      if (message?.status === "generating") {
        if (!deadlines.has(id))
          deadlines.set(id, clock.now() + POLL_ERROR_DELAY_MS);
        ensurePolling(id);
      }
    }
    if (store.getState().outbox.messages.length > 0)
      store.dispatch(outboxSlice.actions.confirmed(confirmed));
  }

  async function transmit(message: OutgoingMessage) {
    const request = store.dispatch(
      api.endpoints.send.initiate({
        client_message_id: message.clientMessageId,
        text: message.text,
      }),
    );
    try {
      const result = await request;
      if (result.data) {
        mergeMessages([result.data.user_message, result.data.reply]);
        store.dispatch(
          outboxSlice.actions.confirmed([message.clientMessageId]),
        );
        if (result.data.reply.status === "generating") {
          deadlines.set(result.data.reply.id, result.data.nextPollAt);
          ensurePolling(result.data.reply.id);
        }
      } else {
        store.dispatch(
          outboxSlice.actions.failed({
            clientMessageId: message.clientMessageId,
            error: "Not sent",
          }),
        );
      }
    } catch (error) {
      console.error("Message request stopped unexpectedly", error);
      store.dispatch(
        outboxSlice.actions.failed({
          clientMessageId: message.clientMessageId,
          error: "Not sent",
        }),
      );
    } finally {
      request.reset();
    }
  }

  return {
    reconcileHistory,
    start() {
      active = true;
      reconcileHistory();
    },
    stop() {
      active = false;
      for (const controller of running.values()) controller.abort();
      // Keep deadlines across background/foreground transitions.
    },
    send(text: string): boolean {
      if (
        !isValidMessageText(text) ||
        !selectors.selectCanSend(store.getState())
      )
        return false;
      const message: OutgoingMessage = {
        clientMessageId: createId(),
        text: text.trim(),
        createdAt: new Date(clock.now()).toISOString(),
        status: "sending",
      };
      store.dispatch(outboxSlice.actions.sending(message));
      void transmit(message);
      return true;
    },
    retry(clientMessageId: string): boolean {
      if (!selectors.selectCanRetry(store.getState())) return false;
      const message = store
        .getState()
        .outbox.messages.find(
          (item) => item.clientMessageId === clientMessageId,
        );
      if (message?.status !== "failed") return false;
      const retry: OutgoingMessage = {
        clientMessageId,
        text: message.text,
        createdAt: message.createdAt,
        status: "sending",
      };
      store.dispatch(outboxSlice.actions.sending(retry));
      void transmit(retry);
      return true;
    },
  };
}
