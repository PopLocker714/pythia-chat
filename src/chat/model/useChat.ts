import { useSelector } from "react-redux";
import type { ChatRuntime } from "./runtime";

export function useChat(runtime: ChatRuntime) {
  const history = runtime.api.useHistoryQuery(undefined, {
    selectFromResult: ({ isLoading, isError }) => ({ isLoading, isError }),
  });
  return {
    messages: useSelector(runtime.selectors.selectMessages),
    canSend: useSelector(runtime.selectors.selectCanSend),
    canRetry: useSelector(runtime.selectors.selectCanRetry),
    isLoading: history.isLoading,
    isError: history.isError,
    reload: history.refetch,
    send: runtime.controller.send,
    retry: runtime.controller.retry,
  };
}
