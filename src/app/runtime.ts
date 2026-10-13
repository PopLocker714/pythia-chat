import { randomUUID } from "expo-crypto";
import { createChatRuntime } from "../chat/model/runtime";

const baseUrl = process.env.EXPO_PUBLIC_API_URL;
if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  throw new Error(
    "Set EXPO_PUBLIC_API_URL in .env to the mock server URL. See .env.example.",
  );
}
export const chat = createChatRuntime({ baseUrl, createId: randomUUID });
