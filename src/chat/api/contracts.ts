import { z } from "zod";

const identity = { id: z.string().min(1), created_at: z.iso.datetime() };
const signSchema = z.object({
  kind: z.enum(["sun", "moon", "rising"]),
  sign: z.string(),
  caption: z.string(),
});

export const userMessageSchema = z.object({
  ...identity,
  role: z.literal("user"),
  status: z.literal("done"),
  client_message_id: z.string().min(1),
  text: z.string(),
});

export const assistantMessageSchema = z.discriminatedUnion("status", [
  z.object({
    ...identity,
    role: z.literal("assistant"),
    client_message_id: z.null(),
    status: z.literal("generating"),
    text: z.null(),
  }),
  z.object({
    ...identity,
    role: z.literal("assistant"),
    client_message_id: z.null(),
    status: z.literal("done"),
    text: z.string(),
    signs: z.array(signSchema).optional(),
  }),
]);

export const historySchema = z.object({
  messages: z.array(z.union([userMessageSchema, assistantMessageSchema])),
});
export const sendResponseSchema = z.object({
  user_message: userMessageSchema,
  reply: assistantMessageSchema,
});
export const replyResponseSchema = z.object({
  message: assistantMessageSchema,
});
