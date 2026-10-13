import { afterEach, describe, expect, test } from "bun:test";
import { messageKey } from "./message";
import {
  createHarness,
  doneReply,
  eventually,
  json,
  portrait,
  reply,
  user,
} from "./test-support";

const harnesses: Awaited<ReturnType<typeof createHarness>>[] = [];
async function setup(handler: Parameters<typeof createHarness>[0]) {
  const harness = await createHarness(handler);
  harnesses.push(harness);
  return harness;
}
afterEach(async () => {
  for (const harness of harnesses.splice(0)) await harness.dispose();
});

describe("chat protocol through RTK Query and HTTP", () => {
  test("loads history and rejects empty/oversized messages", async () => {
    const chat = await setup(() => json({ messages: [portrait] }));
    expect(chat.messages()).toEqual([portrait]);
    expect(chat.controller.send("  ")).toBe(false);
    expect(chat.controller.send("x".repeat(2001))).toBe(false);
    expect(chat.requests).toHaveLength(1);
  });

  test("blocks double taps and waits for each response's Retry-After", async () => {
    let polls = 0;
    const chat = await setup((request) => {
      if (request.method === "POST")
        return json({ user_message: user, reply }, 202, "2");
      if (new URL(request.url).pathname === "/messages")
        return json({ messages: [portrait] });
      return ++polls === 1
        ? json({ message: reply }, 200, "4")
        : json({ message: doneReply });
    });
    const start = chat.clock.now();
    expect(chat.controller.send("Hello")).toBe(true);
    expect(chat.controller.send("Hello")).toBe(false);
    await eventually(() => chat.messages().length === 3);
    expect(chat.selectors.selectCanSend(chat.store.getState())).toBe(false);
    chat.clock.advance(1999);
    await Bun.sleep(10);
    expect(polls).toBe(0);
    chat.clock.advance(1);
    await eventually(() => polls === 1);
    await Bun.sleep(10);
    chat.clock.advance(3999);
    await Bun.sleep(10);
    expect(polls).toBe(1);
    chat.clock.advance(1);
    await eventually(() => chat.selectors.selectCanSend(chat.store.getState()));
    expect(
      chat.requests
        .filter((request) => request.path === "/messages/reply-1")
        .map((request) => request.at - start),
    ).toEqual([2000, 6000]);
    expect(
      chat.requests.filter((request) => request.method === "POST"),
    ).toHaveLength(1);
    expect(chat.messages().at(-1)).toEqual(doneReply);
  });

  test.each([false, true])(
    "retries with the same id and text after a 500 (saved=%s)",
    async (saved) => {
      const bodies: unknown[] = [];
      let persisted = false;
      const chat = await setup(async (request) => {
        if (request.method === "POST") {
          bodies.push(await request.json());
          if (bodies.length === 1) {
            persisted = saved;
            return json({ error: { code: "internal_error" } }, 500);
          }
          persisted = true;
          return json({ user_message: user, reply: doneReply });
        }
        return json({
          messages: persisted ? [portrait, user, doneReply] : [portrait],
        });
      });
      chat.controller.send("Hello");
      await eventually(
        () => chat.store.getState().outbox.messages[0]?.status === "failed",
      );
      const failed = chat.messages().at(-1);
      expect(failed && messageKey(failed)).toBe("user:client-1");
      expect(chat.controller.retry("client-1")).toBe(true);
      expect(chat.controller.retry("client-1")).toBe(false);
      await eventually(
        () => chat.store.getState().outbox.messages.length === 0,
      );
      expect(bodies).toEqual([
        { client_message_id: "client-1", text: "Hello" },
        { client_message_id: "client-1", text: "Hello" },
      ]);
      expect(chat.messages()).toEqual([portrait, user, doneReply]);
      chat.clock.advance(20_000);
      await Bun.sleep(10);
      expect(
        chat.requests.filter((request) => request.path === "/messages/reply-1"),
      ).toHaveLength(0);
    },
  );

  test("does not retry POST automatically after a network failure", async () => {
    const chat = await setup((request) =>
      request.method === "POST"
        ? json({ user_message: user, reply: doneReply })
        : json({ messages: [portrait] }),
    );
    await chat.disconnect();
    chat.controller.send("Hello");
    await eventually(
      () => chat.store.getState().outbox.messages[0]?.status === "failed",
    );
    chat.reconnect();
    chat.clock.advance(60_000);
    await Bun.sleep(20);
    expect(
      chat.requests.filter((request) => request.method === "POST"),
    ).toHaveLength(0);
    expect(chat.controller.retry("client-1")).toBe(true);
    await eventually(() => chat.messages().length === 3);
    expect(chat.messages()).toEqual([portrait, user, doneReply]);
  });

  test("poll errors keep the message sent and respect a new 429 delay", async () => {
    let polls = 0;
    const chat = await setup((request) => {
      if (request.method === "POST")
        return json({ user_message: user, reply }, 202, "1");
      if (new URL(request.url).pathname === "/messages")
        return json({ messages: [portrait] });
      polls++;
      if (polls === 1) return json({ error: {} }, 500);
      if (polls === 2) return json({ error: {} }, 429, "5");
      return json({ message: doneReply });
    });
    chat.controller.send("Hello");
    await eventually(() => chat.messages().length === 3);
    for (const [delay, expected] of [
      [1000, 1],
      [3000, 2],
      [5000, 3],
    ]) {
      chat.clock.advance(delay);
      await eventually(() => polls === expected);
      await Bun.sleep(10);
      expect(chat.store.getState().outbox.messages).toHaveLength(0);
    }
    expect(chat.messages()).toEqual([portrait, user, doneReply]);
  });

  test("reconciles a saved-but-failed send from history without duplicates", async () => {
    let sent = false;
    const chat = await setup((request) => {
      if (request.method === "POST") {
        sent = true;
        return json({ error: {} }, 500);
      }
      return json({
        messages: sent ? [portrait, user, doneReply] : [portrait],
      });
    });
    chat.controller.send("Hello");
    await eventually(
      () => chat.store.getState().outbox.messages[0]?.status === "failed",
    );
    await chat.store.dispatch(
      chat.api.endpoints.history.initiate(undefined, {
        forceRefetch: true,
        subscribe: false,
      }),
    );
    expect(chat.messages()).toEqual([portrait, user, doneReply]);
    expect(chat.store.getState().outbox.messages).toHaveLength(0);
  });

  test("restores a generating reply from history and pauses polling in background", async () => {
    let polls = 0;
    const chat = await setup((request) => {
      if (new URL(request.url).pathname === "/messages")
        return json({ messages: [portrait, user, reply] });
      polls++;
      return json({ message: doneReply });
    });
    chat.controller.stop();
    chat.clock.advance(10_000);
    await Bun.sleep(10);
    expect(polls).toBe(0);
    chat.controller.start();
    await eventually(() => chat.messages().at(-1)?.status === "done");
    expect(polls).toBe(1);
  });

  test("rejects malformed history at the network boundary", async () => {
    const chat = await setup(() =>
      json({ messages: [{ role: "assistant", status: "done", text: null }] }),
    );
    expect(
      chat.api.endpoints.history.select()(chat.store.getState()).isError,
    ).toBe(true);
    expect(chat.messages()).toEqual([]);
    expect(chat.controller.send("Hello")).toBe(false);
  });

  test("aborts an in-flight poll and resumes without applying its late response", async () => {
    let polls = 0;
    let releaseFirst: (() => void) | undefined;
    const firstResponse = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const chat = await setup(async (request) => {
      if (new URL(request.url).pathname === "/messages")
        return json({ messages: [portrait, user, reply] });
      polls++;
      if (polls === 1) {
        await firstResponse;
        return json({ message: reply }, 200, "30");
      }
      return json({ message: doneReply });
    });
    chat.clock.advance(3000);
    await eventually(() => polls === 1);
    chat.controller.stop();
    await Bun.sleep(10);
    chat.controller.start();
    await eventually(() => chat.messages().at(-1)?.status === "done");
    releaseFirst?.();
    await Bun.sleep(10);
    expect(chat.messages().at(-1)).toEqual(doneReply);
    expect(polls).toBe(2);
    chat.clock.advance(60_000);
    await Bun.sleep(10);
    expect(polls).toBe(2);
  });

  test("keeps stable row identities and references across a 10,000-message history", async () => {
    const history = Array.from({ length: 10_000 }, (_, i) => ({
      ...portrait,
      id: `history-${i}`,
    }));
    const chat = await setup((request) =>
      request.method === "POST"
        ? json({ error: {} }, 500)
        : json({ messages: history }),
    );
    const before = chat.messages();
    chat.controller.send("Hello");
    await eventually(
      () => chat.store.getState().outbox.messages[0]?.status === "failed",
    );
    const after = chat.messages();
    expect(after).toHaveLength(10_001);
    expect(after[0]).toBe(before[0]);
    expect(after[9999]).toBe(before[9999]);
    expect(new Set(after.map(messageKey)).size).toBe(10_001);
  });
});
