import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, Check, Search, FileText, GitCompare, CalendarPlus, CalendarX, Wrench, Bookmark, BookmarkX, Sparkles, ListChecks } from "lucide-react";
import jiggmi from "../../imports/jiggmi.png";
import type { ChatMessage } from "../../hooks/useChat";
import type { ChatToolStep } from "../../types/agent";

// BE tool 이름 → 사용자에게 보일 한국어 라벨 + 아이콘
const TOOL_META: Record<string, { label: string; Icon: typeof Search }> = {
  search_issues: { label: "이슈 검색", Icon: Search },
  get_issue_detail: { label: "이슈 상세 조회", Icon: FileText },
  find_similar_events: { label: "유사 이슈 찾기", Icon: GitCompare },
  compare_with_similar_events: { label: "유사 이슈 비교", Icon: GitCompare },
  register_calendar_event: { label: "캘린더 등록", Icon: CalendarPlus },
  remove_calendar_event: { label: "캘린더에서 삭제", Icon: CalendarX },
  add_bookmark: { label: "관심 이슈 담기", Icon: Bookmark },
  remove_bookmark: { label: "관심 이슈 빼기", Icon: BookmarkX },
  recommend_for_me: { label: "맞춤 추천", Icon: Sparkles },
  get_my_activity: { label: "내 활동 조회", Icon: ListChecks },
};

// 자율 에이전트의 도구 사용 단계 타임라인
function ToolSteps({ steps }: { steps: ChatToolStep[] }) {
  return (
    <div className="mb-2 space-y-1">
      {steps.map((s, i) => {
        const meta = TOOL_META[s.name] ?? { label: s.name, Icon: Wrench };
        const { Icon } = meta;
        return (
          <div key={i} className="flex items-center gap-1.5 text-[12px] text-[#475467]">
            {s.status === "running"
              ? <Loader2 className="size-3.5 shrink-0 animate-spin text-[#1167e8]" />
              : <Check className="size-3.5 shrink-0 text-[#2f9e44]" />}
            <Icon className="size-3.5 shrink-0 text-[#9ca3af]" />
            <span>{meta.label}{s.status === "running" ? " 중…" : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 상시 플로팅 챗봇 위젯 (KAN-41).
 * 대화 상태(messages/loading)는 App의 useChat가 보유하고 props로 주입된다 →
 * 화면이 바뀌어도 대화가 유지된다.
 *
 * issueTitle이 있으면 "현재 보고 있는 이슈"로 표시되며,
 * onSend는 App에서 현재 이슈 컨텍스트(issueId/issueType)를 바인딩해 전달한다.
 */
export function ChatWidget({
  open, onOpenChange, messages, loading, onSend, issueTitle, onOpenSource,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  loading: boolean;
  onSend: (question: string) => void;
  issueTitle?: string;
  onOpenSource?: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const submit = () => {
    const q = input.trim();
    if (!q || loading) return;
    onSend(q);
    setInput("");
  };

  if (!open) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        title="AI 챗봇"
        className="fixed bottom-6 right-6 z-50 flex size-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_10px_30px_rgba(17,103,232,0.4)] ring-2 ring-[#1167e8] transition-transform hover:scale-105"
      >
        <img src={jiggmi} alt="지그미" className="size-full object-cover" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[20px] border border-[#e4eaf3] bg-white shadow-[0_24px_64px_rgba(16,24,40,0.22)]">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#1167e8] px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <img src={jiggmi} alt="지그미" className="size-7 rounded-full bg-white object-cover" />
          <span className="text-[15px] font-[700]">지그미 — AI 챗봇</span>
        </div>
        <button onClick={() => onOpenChange(false)} title="닫기" className="rounded-full p-1 transition-colors hover:bg-white/20">
          <X className="size-5" />
        </button>
      </div>

      {/* 현재 보고 있는 이슈 컨텍스트 */}
      {issueTitle && (
        <div className="border-b border-[#eef2f8] bg-[#f4f7fc] px-4 py-2 text-[12px] text-[#475467]">
          현재 이슈: <span className="font-[600] text-[#1167e8]">{issueTitle}</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <img src={jiggmi} alt="지그미" className="size-20 object-contain" />
            <p className="text-[13px] leading-relaxed text-[#9ca3af]">
              안녕하세요, 지그미예요!<br />법안·청원·입법예고에 대해<br />궁금한 점을 자유롭게 물어보세요.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
              m.role === "user"
                ? "bg-[#1167e8] text-white"
                : "bg-[#f4f7fc] text-[#111827]"
            }`}>
              {m.role === "assistant" && m.steps && m.steps.length > 0 && <ToolSteps steps={m.steps} />}
              {m.text ? (
                <p className="whitespace-pre-wrap">{m.text}</p>
              ) : m.role === "assistant" && (!m.steps || m.steps.length === 0) ? (
                <span className="flex items-center gap-2 text-[#9ca3af]">
                  <Loader2 className="size-4 animate-spin" />지그미가 생각하고 있어요…
                </span>
              ) : null}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-[#e4eaf3] pt-2">
                  {m.sources.map((s) => (
                    <button
                      key={`${s.type}-${s.id}`}
                      onClick={() => onOpenSource?.(s.id)}
                      disabled={!onOpenSource}
                      className="flex w-full items-start gap-1.5 rounded-md px-1 py-0.5 text-left text-[12px] text-[#475467] transition-colors enabled:hover:bg-white disabled:cursor-default"
                    >
                      <span className="mt-0.5 shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-[700] uppercase text-[#1167e8]">{s.type}</span>
                      <span className="flex-1">{s.title}</span>
                      <span className="shrink-0 font-[600] text-[#ef4444]">{s.dDay}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-[#eef2f8] px-3 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="질문을 입력하세요"
          className="flex-1 rounded-full border border-[#e4eaf3] bg-[#f8fafc] px-4 py-2 text-[14px] outline-none focus:border-[#1167e8]"
        />
        <button
          onClick={submit}
          disabled={loading || !input.trim()}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1167e8] text-white transition-opacity disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
