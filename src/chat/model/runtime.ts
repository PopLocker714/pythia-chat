import { createChatApi } from "../api/chat-api";
import { type Clock, systemClock } from "./clock";
import { createChatController } from "./controller";
import { createChatSelectors } from "./selectors";
import { createChatStore } from "./store";

export function createChatRuntime(options: {
  baseUrl: string;
  createId(): string;
  clock?: Clock;
}) {
  const clock = options.clock ?? systemClock;
  const api = createChatApi(options.baseUrl, clock.now);
  const { store, listener } = createChatStore(api);
  const controller = createChatController({
    api,
    store,
    clock,
    createId: options.createId,
  });
  listener.startListening({
    matcher: api.endpoints.history.matchFulfilled,
    effect: () => controller.reconcileHistory(),
  });
  return { api, store, controller, selectors: createChatSelectors(api) };
}

export type ChatRuntime = ReturnType<typeof createChatRuntime>;
