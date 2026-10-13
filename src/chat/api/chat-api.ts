import { createEntityAdapter } from "@reduxjs/toolkit";
import {
  type BaseQueryFn,
  type FetchArgs,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { z } from "zod";
import type { ServerMessage } from "../model/message";
import {
  historySchema,
  replyResponseSchema,
  sendResponseSchema,
} from "./contracts";
import { POLL_ERROR_DELAY_MS, retryAfterMs } from "./retry-after";

export type ChatApiError = {
  status: number | "NETWORK_ERROR" | "INVALID_RESPONSE";
  message: string;
  nextPollAt: number;
};

type ResponseTiming = { nextPollAt: number };
type QueryResult =
  | { data: unknown; meta?: ResponseTiming }
  | { error: ChatApiError; meta?: ResponseTiming };

export const messagesAdapter = createEntityAdapter<ServerMessage>();
export const emptyHistory = messagesAdapter.getInitialState();

function validateResponse<T>(
  result: QueryResult,
  schema: z.ZodType<T>,
): { data: T; nextPollAt: number } | { error: ChatApiError } {
  if ("error" in result) return { error: result.error };
  const parsed = schema.safeParse(result.data);
  if (!parsed.success) {
    return {
      error: {
        status: "INVALID_RESPONSE" as const,
        message: "The server returned an invalid response.",
        nextPollAt: result.meta?.nextPollAt ?? Date.now() + POLL_ERROR_DELAY_MS,
      },
    };
  }
  return { data: parsed.data, nextPollAt: result.meta?.nextPollAt ?? 0 };
}

export function createChatApi(baseUrl: string, now = Date.now) {
  const fetchQuery = fetchBaseQuery({ baseUrl, timeout: 15_000 });
  const baseQuery: BaseQueryFn<
    string | FetchArgs,
    unknown,
    ChatApiError,
    object,
    ResponseTiming
  > = async (args, api, options) => {
    const result = await fetchQuery(args, api, options);
    const receivedAt = now();
    const delay = retryAfterMs(
      result.meta?.response?.headers.get("Retry-After") ?? null,
      receivedAt,
    );
    const meta = { nextPollAt: receivedAt + (delay ?? POLL_ERROR_DELAY_MS) };
    if (result.error) {
      return {
        error: {
          status:
            typeof result.error.status === "number"
              ? result.error.status
              : "NETWORK_ERROR",
          message: "Couldn't reach Pythia. Please try again.",
          nextPollAt: meta.nextPollAt,
        },
        meta,
      };
    }
    return { data: result.data, meta };
  };

  return createApi({
    reducerPath: "chatApi",
    baseQuery,
    keepUnusedDataFor: 300,
    endpoints: (build) => ({
      history: build.query<typeof emptyHistory, void>({
        async queryFn(_arg, _api, _options, query) {
          const result = validateResponse(
            await query("/messages"),
            historySchema,
          );
          if ("error" in result) return { error: result.error };
          return {
            data: messagesAdapter.setAll(
              messagesAdapter.getInitialState(),
              result.data.messages,
            ),
          };
        },
        // A delayed history response must not regress a reply already completed by polling.
        merge(current, incoming) {
          for (const id of incoming.ids) {
            const message = incoming.entities[id];
            if (message && current.entities[id]?.status !== "done") {
              messagesAdapter.upsertOne(current, message);
            }
          }
        },
      }),
      send: build.mutation<
        z.infer<typeof sendResponseSchema> & ResponseTiming,
        { client_message_id: string; text: string }
      >({
        async queryFn(body, _api, _options, query) {
          const result = validateResponse(
            await query({ url: "/messages", method: "POST", body }),
            sendResponseSchema,
          );
          if ("error" in result) return { error: result.error };
          if (
            result.data.user_message.client_message_id !==
              body.client_message_id ||
            result.data.user_message.text !== body.text
          ) {
            return {
              error: {
                status: "INVALID_RESPONSE",
                message: "The server returned a different message.",
                nextPollAt: result.nextPollAt,
              },
            };
          }
          return { data: { ...result.data, nextPollAt: result.nextPollAt } };
        },
      }),
      reply: build.query<
        z.infer<typeof replyResponseSchema> & ResponseTiming,
        string
      >({
        keepUnusedDataFor: 0,
        async queryFn(id, _api, _options, query) {
          const result = validateResponse(
            await query(`/messages/${encodeURIComponent(id)}`),
            replyResponseSchema,
          );
          if ("error" in result) return { error: result.error };
          if (result.data.message.id !== id) {
            return {
              error: {
                status: "INVALID_RESPONSE",
                message: "The server returned a different reply.",
                nextPollAt: result.nextPollAt,
              },
            };
          }
          return { data: { ...result.data, nextPollAt: result.nextPollAt } };
        },
      }),
    }),
  });
}

export type ChatApi = ReturnType<typeof createChatApi>;
