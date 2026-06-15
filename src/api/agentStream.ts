import { BASE_URL, getToken } from "./client";
import type { ChatSource, ChatTurn } from "../types/agent";
import type { DetailPageAnalysisResponse } from "./agent";

/**
 * 에이전트 SSE 스트림 (KAN-44).
 * EventSource는 Authorization 헤더를 못 싣으므로 fetch + ReadableStream으로 text/event-stream을 파싱한다.
 * 이벤트 payload(JSON)의 `type` 필드로 분기한다. (챗봇 + 상세페이지 분석 공용)
 */
type SseEvent = {
  type: string;
  name?: string;
  input?: string;
  text?: string;
  sources?: ChatSource[];
  result?: DetailPageAnalysisResponse;
};

// 공용 리더: path로 POST 후 SSE 이벤트를 onEvent로 흘려보낸다.
async function readSSE(
  path: string,
  body: unknown,
  signal: AbortSignal,
  onEvent: (evt: SseEvent) => void,
  onError: (msg: string) => void,
) {
  try {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok || !res.body) {
      onError("요청에 실패했어요.");
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        dispatch(buffer.slice(0, idx), onEvent);
        buffer = buffer.slice(idx + 2);
      }
    }
    if (buffer.trim()) dispatch(buffer, onEvent);
  } catch (e) {
    if ((e as { name?: string })?.name !== "AbortError") {
      onError("응답을 가져오지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }
}

function dispatch(chunk: string, onEvent: (evt: SseEvent) => void) {
  const json = chunk
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim())
    .join("");
  if (!json) return;
  try {
    onEvent(JSON.parse(json) as SseEvent);
  } catch {
    /* 부분 청크 무시 */
  }
}

// ── 챗봇 스트림 ───────────────────────────────────────────
export interface ChatStreamHandlers {
  onToolStart?: (e: { name: string; input?: string }) => void;
  onObservation?: (e: { name: string; text?: string }) => void;
  onAnswer?: (text: string) => void;
  onSources?: (sources: ChatSource[]) => void;
  onDone?: () => void;
  onError?: (text: string) => void;
}

export interface ChatStreamOpts {
  issueId?: string;
  issueType?: string;
  history?: ChatTurn[];
}

export function chatWithAgentStream(
  question: string,
  opts: ChatStreamOpts,
  h: ChatStreamHandlers,
): AbortController {
  const controller = new AbortController();
  readSSE("/api/agent/chat/stream",
    { question, issueId: opts.issueId, issueType: opts.issueType, history: opts.history },
    controller.signal,
    (evt) => {
      switch (evt.type) {
        case "tool_start": h.onToolStart?.({ name: evt.name ?? "", input: evt.input }); break;
        case "observation": h.onObservation?.({ name: evt.name ?? "", text: evt.text }); break;
        case "answer": h.onAnswer?.(evt.text ?? ""); break;
        case "sources": h.onSources?.(evt.sources ?? []); break;
        case "done": h.onDone?.(); break;
        case "error": h.onError?.(evt.text ?? "오류가 발생했어요."); break;
      }
    },
    (msg) => h.onError?.(msg),
  );
  return controller;
}

// ── 상세페이지 분석 스트림 ─────────────────────────────────
export interface AnalyzeStreamHandlers {
  onToolStart?: (e: { name: string; input?: string }) => void;
  onObservation?: (e: { name: string; text?: string }) => void;
  onResult?: (result: DetailPageAnalysisResponse) => void;
  onDone?: () => void;
  onError?: (text: string) => void;
}

export function analyzeIssueStream(
  issueId: string,
  issueType: string,
  h: AnalyzeStreamHandlers,
): AbortController {
  const controller = new AbortController();
  readSSE("/api/agent/analyze/stream",
    { issueId, issueType },
    controller.signal,
    (evt) => {
      switch (evt.type) {
        case "tool_start": h.onToolStart?.({ name: evt.name ?? "", input: evt.input }); break;
        case "observation": h.onObservation?.({ name: evt.name ?? "", text: evt.text }); break;
        case "result": if (evt.result) h.onResult?.(evt.result); break;
        case "done": h.onDone?.(); break;
        case "error": h.onError?.(evt.text ?? "오류가 발생했어요."); break;
      }
    },
    (msg) => h.onError?.(msg),
  );
  return controller;
}
