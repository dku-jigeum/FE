import { useEffect, useState } from "react";
import { registerCalendarEvent, type DetailPageAnalysisResponse } from "../../../api/agent";
import { analyzeIssueStream } from "../../../api/agentStream";

// 분석에 쓰이는 도구 이름 → 사용자에게 보일 한국어 라벨
const ANALYZE_TOOL_LABEL: Record<string, string> = {
  summarize_event: "이슈 요약",
  explain_recommendation_reason: "추천 이유 분석",
  analyze_user_impact: "내 영향 분석",
  extract_key_dates: "주요 일정 추출",
  decide_calendar_registration: "캘린더 등록 판단",
  recommend_user_action: "추천 행동 정리",
  find_similar_events: "유사 이슈 찾기",
  compare_with_similar_events: "유사 이슈 비교",
  ask_missing_profile_question: "프로필 보완 질문",
};

interface ToolStep {
  name: string;
  status: "running" | "done";
}

interface AgentAnalysisScreenProps {
  issueId: string;
  issueType: string;
  issueTitle: string;
  dnum: number;
  onComplete: (calendarAccepted: boolean, result?: DetailPageAnalysisResponse) => void;
}

type Phase = "loading" | "calendar" | "done";

function StepIcon({ status }: { status: "pending" | "running" | "done" }) {
  if (status === "running") {
    return (
      <div className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#EFF6FF]">
        <span className="inline-block size-[10px] animate-spin rounded-full border-[1.5px] border-[#BFDBFE] border-t-[#2563EB]" />
      </div>
    );
  }
  return (
    <div className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#EFF6FF]">
      <svg width="8" height="8" viewBox="0 0 8 8">
        <path
          d="M4 0.5L7.5 4L4 7.5L0.5 4L4 0.5Z"
          fill={status === "done" ? "#2563EB" : "none"}
          stroke={status === "pending" ? "#BFDBFE" : "none"}
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}

export function AgentAnalysisScreen({
  issueId,
  issueType,
  issueTitle,
  dnum,
  onComplete,
}: AgentAnalysisScreenProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [steps, setSteps] = useState<ToolStep[]>([]);
  const [result, setResult] = useState<DetailPageAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const controller = analyzeIssueStream(issueId, issueType, {
      onToolStart: ({ name }) =>
        setSteps((prev) => [...prev, { name, status: "running" }]),
      onObservation: ({ name }) =>
        setSteps((prev) => {
          const next = prev.slice();
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].name === name && next[i].status === "running") {
              next[i] = { ...next[i], status: "done" };
              break;
            }
          }
          return next;
        }),
      onResult: (data) => {
        if (cancelled) return;
        setResult(data);
        if (data.analysis.keyDates.calendarSuggestion.shouldSuggest) {
          setPhase("calendar");
        } else {
          setPhase("done");
          setTimeout(() => { if (!cancelled) onComplete(false, data); }, 1500);
        }
      },
      onError: (msg) => {
        if (cancelled) return;
        setError(msg ?? "분석 중 오류가 발생했습니다.");
        setPhase("done");
        setTimeout(() => { if (!cancelled) onComplete(false, undefined); }, 2000);
      },
    });

    return () => { cancelled = true; controller.abort(); };
  }, []);

  const handleCalendar = async (accept: boolean) => {
    if (accept && result) {
      setCalendarLoading(true);
      const cal = result.analysis.keyDates.calendarSuggestion;
      try {
        await registerCalendarEvent(issueId, issueType, cal.calendarTitle, cal.calendarDate, cal.reminder);
      } catch {
        // 등록 실패해도 분석 결과 화면으로 진행
      } finally {
        setCalendarLoading(false);
      }
    }
    setPhase("done");
    onComplete(accept, result ?? undefined);
  };

  const isLoading = phase === "loading";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-14 bg-[linear-gradient(160deg,#F3F7FC_0%,#F0F5FF_100%)]"
      style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}
    >
      {/* 분석 과정 카드 */}
      <div className="w-full max-w-[700px] overflow-hidden rounded-2xl bg-white border border-[#E5ECF8] shadow-[0_12px_30px_rgba(30,64,175,0.06)]">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EEF2FA]">
          <div className="flex items-center gap-2.5">
            <StepIcon status={isLoading ? "running" : "done"} />
            <span className="text-sm font-bold text-[#0F172A]">분석 과정</span>
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex size-6 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F0F5FF]"
          >
            {collapsed ? "+" : "−"}
          </button>
        </div>

        {!collapsed && (
          <div className="px-5 py-1">
            {steps.map((step, idx) => {
              const label = ANALYZE_TOOL_LABEL[step.name] ?? step.name;
              return (
                <div
                  key={`${step.name}-${idx}`}
                  className="flex items-center gap-2.5 py-3.5 border-b border-[#EEF2FA]"
                >
                  <StepIcon status={step.status} />
                  <span className="text-sm font-bold text-[#0F172A]">{label}</span>
                  {step.status === "running" && (
                    <span className="animate-pulse text-xs text-[#94A3B8]">처리 중...</span>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 px-0 py-3 border-t border-[#EEF2FA]">
                <div className="flex items-center gap-[5px]">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block size-[5px] rounded-full bg-[#93C5FD]"
                      style={{ animation: `dotBounce 1.4s ease-in-out ${i * 0.22}s infinite` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#94A3B8]">답변을 생성하고 있어요...</span>
              </div>
            )}
            {phase === "done" && (
              <div className="flex items-center gap-2 px-0 py-3 border-t border-[#EEF2FA]">
                {error ? (
                  <span className="text-xs text-[#EF4444]">{error} — 상세 페이지로 이동합니다...</span>
                ) : (
                  <>
                    <span className="text-[#2563EB]">✓</span>
                    <span className="text-xs text-[#94A3B8]">분석 완료 — 상세 페이지로 이동합니다...</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 캘린더 제안 */}
        {phase === "calendar" && result && (
          <div className="mx-4 mb-4 mt-1 rounded-xl p-4 bg-[#F8FAFF] border border-[#E5ECF8]">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF]">
                <span className="text-[15px]">📅</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0F172A]">
                  마감까지 <span className="text-[#EF4444]">{result.analysis.keyDates.dates[0]?.dDay ?? `D-${dnum}`}</span> 남았습니다
                </p>
                <p className="mt-0.5 text-[13px] text-[#64748B]">
                  {result.analysis.keyDates.calendarSuggestion.reason || "캘린더에 등록하고 알림을 받아보시겠어요?"}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleCalendar(true)}
                    disabled={calendarLoading}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2 bg-[#2563EB] text-white text-[13px] font-bold hover:opacity-90 disabled:opacity-60"
                  >
                    {calendarLoading ? "등록 중..." : "네, 등록해주세요"}
                  </button>
                  <button
                    onClick={() => handleCalendar(false)}
                    disabled={calendarLoading}
                    className="rounded-lg px-4 py-2 bg-white border border-[#E5ECF8] text-[#475569] text-[13px] hover:bg-[#F8FAFF] disabled:opacity-60"
                  >
                    괜찮아요
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-5 max-w-[700px] truncate px-4 text-center text-xs text-[#94A3B8]">
        {issueTitle}
      </p>

      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
