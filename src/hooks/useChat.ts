import { useState } from "react";
import { chatWithAgentStream } from "../api/agentStream";
import type { ChatSource, ChatToolStep } from "../types/agent";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  steps?: ChatToolStep[];   // 자율 에이전트가 사용한 도구 단계(실시간)
}

// 멀티턴 — 최근 N개 메시지만 컨텍스트로 전달
const HISTORY_LIMIT = 6;

/**
 * 챗봇 대화 상태를 App 레벨에서 보유하기 위한 훅.
 * 화면이 바뀌어도(홈↔상세↔캘린더) 대화가 유지된다.
 *
 * 자율 ReAct 에이전트를 SSE로 호출해 도구 사용 과정을 실시간 반영한다(KAN-44).
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const send = (question: string, issueId?: string, issueType?: string) => {
    const q = question.trim();
    if (!q || loading) return;

    const history = messages.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.text }));

    // user 메시지 + assistant placeholder 동시 추가
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "assistant", text: "", steps: [] },
    ]);
    setLoading(true);

    // 항상 마지막(assistant placeholder) 메시지만 갱신
    const updateLast = (fn: (m: ChatMessage) => ChatMessage) =>
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? fn(m) : m)));

    chatWithAgentStream(q, { issueId, issueType, history }, {
      onToolStart: ({ name, input }) =>
        updateLast((m) => ({ ...m, steps: [...(m.steps ?? []), { name, input, status: "running" }] })),
      onObservation: ({ name, text }) =>
        updateLast((m) => {
          const steps = (m.steps ?? []).slice();
          for (let i = steps.length - 1; i >= 0; i--) {
            if (steps[i].name === name && steps[i].status === "running") {
              steps[i] = { ...steps[i], status: "done", observation: text };
              break;
            }
          }
          return { ...m, steps };
        }),
      onAnswer: (text) => updateLast((m) => ({ ...m, text })),
      onSources: (sources) => updateLast((m) => ({ ...m, sources })),
      onDone: () => setLoading(false),
      onError: (text) => {
        updateLast((m) => ({ ...m, text: m.text || text || "답변을 가져오지 못했어요." }));
        setLoading(false);
      },
    });
  };

  return { messages, loading, send };
}
