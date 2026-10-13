import type { Clock } from "./clock";
import type { AssistantMessage, UserMessage } from "./message";
import { createChatRuntime } from "./runtime";

export class ManualClock implements Clock {
  private time = Date.parse("2026-10-13T12:00:00Z");
  private waits = new Set<{ deadline: number; release(): void }>();
  now = () => this.time;

  waitUntil(deadline: number, signal: AbortSignal): Promise<void> {
    if (signal.aborted) return Promise.reject(new Error("Stopped"));
    if (deadline <= this.time) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const abort = () => {
        this.waits.delete(wait);
        reject(new Error("Stopped"));
      };
      const wait = {
        deadline,
        release: () => {
          this.waits.delete(wait);
          signal.removeEventListener("abort", abort);
          resolve();
        },
      };
      this.waits.add(wait);
      signal.addEventListener("abort", abort, { once: true });
    });
  }
  advance(ms: number) {
    this.time += ms;
    for (const wait of this.waits)
      if (wait.deadline <= this.time) wait.release();
  }
}

export const portrait: AssistantMessage = {
  id: "portrait",
  role: "assistant",
  client_message_id: null,
  status: "done",
  text: "Welcome",
  created_at: "2026-10-13T11:59:00Z",
  signs: [{ kind: "sun", sign: "Pisces", caption: "Your core self" }],
};
export const reply: AssistantMessage = {
  id: "reply-1",
  role: "assistant",
  client_message_id: null,
  status: "generating",
  text: null,
  created_at: "2026-10-13T12:00:00Z",
};
export const doneReply: AssistantMessage = {
  ...reply,
  status: "done",
  text: "A thoughtful answer",
};
export const user: UserMessage = {
  id: "user-1",
  role: "user",
  status: "done",
  client_message_id: "client-1",
  text: "Hello",
  created_at: "2026-10-13T12:00:00Z",
};

export function json(body: unknown, status = 200, retryAfter?: string) {
  return Response.json(body, {
    status,
    headers:
      retryAfter === undefined ? undefined : { "Retry-After": retryAfter },
  });
}

export async function eventually(condition: () => boolean) {
  const deadline = Date.now() + 1500;
  while (!condition()) {
    if (Date.now() >= deadline)
      throw new Error("Condition did not become true");
    await Bun.sleep(2);
  }
}

export async function createHarness(
  handler: (request: Request) => Response | Promise<Response>,
) {
  const clock = new ManualClock();
  const requests: { method: string; path: string; at: number }[] = [];
  const fetch = (request: Request) => {
    requests.push({
      method: request.method,
      path: new URL(request.url).pathname,
      at: clock.now(),
    });
    return handler(request);
  };
  let server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch });
  const port = server.port;
  let sequence = 0;
  const runtime = createChatRuntime({
    baseUrl: server.url.toString(),
    clock,
    createId: () => `client-${++sequence}`,
  });
  runtime.controller.start();
  const history = runtime.store.dispatch(
    runtime.api.endpoints.history.initiate(),
  );
  await history;
  return {
    ...runtime,
    clock,
    requests,
    messages: () => runtime.selectors.selectMessages(runtime.store.getState()),
    async disconnect() {
      await server.stop(true);
    },
    reconnect() {
      server = Bun.serve({ port, hostname: "127.0.0.1", fetch });
    },
    async dispose() {
      runtime.controller.stop();
      history.unsubscribe();
      runtime.store.dispatch(runtime.api.util.resetApiState());
      await server.stop(true);
    },
  };
}
