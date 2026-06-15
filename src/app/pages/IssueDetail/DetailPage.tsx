import { useEffect, useState } from "react";
import {
  Bookmark, ChevronDown, ChevronRight, Eye, FileCheck,
  FileText, Gavel, Landmark, MessageSquareText, Share2, Sparkles, TrendingUp, Vote,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import type { Issue } from "../../../types/issue";
import type { DetailPageAnalysisResponse, ImpactLevel, ImpactType, SimilarIssueDto } from "../../../types/agent";
import { getSimilarEvents, registerCalendarEvent } from "../../../api/agent";
import { getBookmarks, addBookmark, removeBookmark } from "../../../api/bookmarks";
import { TYPE_COLOR } from "./../../pages/Home/HomePage";

// ── 상수 ─────────────────────────────────────────────────
const IMPACT_LEVEL_LABEL: Record<ImpactLevel, string> = {
  high: "높음", medium: "중간", low: "낮음", unknown: "분석 중",
};
const IMPACT_TYPE_STYLE: Record<ImpactType, { label: string; bg: string; text: string }> = {
  benefit: { label: "긍정적 영향 가능성", bg: "#e8f5e9", text: "#2f9e44" },
  risk:    { label: "부정적 영향 가능성", bg: "#fff0f0", text: "#e03131" },
  mixed:   { label: "복합적 영향",       bg: "#fff7e6", text: "#e07b00" },
  neutral: { label: "중립",             bg: "#f0f4ff", text: "#1167e8" },
  unknown: { label: "분석 중",          bg: "#f8fafc", text: "#9ca3af" },
};
const BE_TYPE_MAP: Record<string, string> = {
  "법안": "bill", "청원": "petition", "입법예고": "legislation",
};

// 프로필 응답 제출은 아직 BE 엔드포인트가 없어 임시 안내만 노출 (참여=외부링크, 북마크=API 연동 완료)
const comingSoon = (msg = "아직 준비 중인 기능이에요.") => alert(msg);

// ── Props ─────────────────────────────────────────────────
interface DetailPageProps {
  issue: Issue;
  progress: number;
  onHome: () => void;
  onOpen: (id: string) => void;
  agentResult: DetailPageAnalysisResponse | null;
  allIssues: Issue[];
}

export function DetailPage({ issue, progress, onHome, onOpen, agentResult, allIssues }: DetailPageProps) {
  const typeStyle = TYPE_COLOR[issue.type];

  return (
    <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-5 py-8 lg:grid-cols-[1fr_320px]">
      <section className="space-y-5">
        <button onClick={onHome} className="text-[14px] text-[#667085] hover:text-[#1167e8]">← 목록으로 가기</button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-[#eaf2ff] text-[#1167e8] hover:bg-[#eaf2ff]">국민참여</Badge>
          <span className="rounded-full px-3 py-1 text-[12px] font-[700]" style={{ background: typeStyle.bg, color: typeStyle.text }}>
            {issue.type}
          </span>
          <Badge variant="outline">{issue.category}</Badge>
        </div>
        <h1 className="ml-6 text-[30px] font-[850] leading-snug tracking-[-0.04em] sm:text-[36px]">{issue.title}</h1>
        <p className="-mt-1 ml-6 text-[14px] text-[#667085] flex items-center gap-2">
          <span>의안번호 {issue.billNumber}</span>
          <span className="text-[#d0d5dd]">|</span>
          <span>발의일 {issue.proposalDate}</span>
          <span className="text-[#d0d5dd]">|</span>
          <span>{issue.proposer}</span>
          <span className="text-[#d0d5dd]">|</span>
          <span>마감 {issue.deadline}</span>
        </p>
        <DetailAgentSection agentResult={agentResult} issue={issue} />
      </section>
      <DetailSidebar issue={issue} progress={progress} onHome={onHome} onOpen={onOpen} allIssues={allIssues} />
    </main>
  );
}

// ── DetailAgentSection ────────────────────────────────────
function DetailAgentSection({ agentResult, issue }: {
  agentResult: DetailPageAnalysisResponse | null;
  issue: Issue;
}) {
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarDone, setCalendarDone] = useState(false);
  const linkUrl = issue.linkUrl;

  const handleCalendarAction = async () => {
    if (calendarDone) return;
    setCalendarLoading(true);
    try {
      const cal = agentResult?.analysis.keyDates.calendarSuggestion;
      await registerCalendarEvent(issue.id, BE_TYPE_MAP[issue.type] ?? "bill",
        cal?.calendarTitle, cal?.calendarDate, cal?.reminder);
      setCalendarDone(true);
    } catch {
      alert("캘린더 등록에 실패했습니다.");
    } finally {
      setCalendarLoading(false);
    }
  };

  const a = agentResult?.analysis;
  const recReason = a?.recommendationReason;
  const impact = a?.userImpact;
  const keyDates = a?.keyDates;
  const calSuggestion = keyDates?.calendarSuggestion;
  const actions = a?.recommendedActions.actions ?? [
    ...(linkUrl ? [{ type: "view_original", label: "법안 원문 보기", reason: "세부 개정 내용을 직접 확인할 수 있어요.", priority: "high" as const }] : []),
    { type: "view_similar_events", label: "비슷한 이슈 보기", reason: "관련 정책 흐름을 함께 살펴볼 수 있어요.", priority: "medium" as const },
    { type: "save_event", label: "관심 이슈 담기", reason: "이후 진행 상황이 바뀌면 다시 확인하기 좋아요.", priority: "medium" as const },
  ];
  const missing = a?.missingProfileQuestion;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#eaf2ff] to-[#f0f4ff] px-5 py-3">
        <Sparkles className="size-5 text-[#1167e8]" />
        <div>
          <p className="text-[15px] font-[700] text-[#1167e8]">{a?.agentHeader.title ?? "AI 맞춤 분석"}</p>
          <p className="text-[12px] text-[#667085]">{a?.agentHeader.description ?? "회원님의 관심사와 이슈 내용을 바탕으로 분석했어요."}</p>
        </div>
      </div>

      <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[18px]">
            <Gavel className="size-5 text-[#1167e8]" />{a?.summary.title ?? "AI 한눈에 요약"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl bg-[#eaf2ff] p-5">
            <p className="mb-3 text-[14px] font-[700] text-[#1167e8]">주요내용</p>
            {a ? (
              <ul className="space-y-2">
                {a.summary.items.map((line, i) => (
                  <li key={i} className="flex gap-2 text-[15px]">
                    <span className="mt-0.5 text-[#1167e8]">✓</span>{line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-[#667085]">{issue.summary}</p>
            )}
          </div>
          {linkUrl && (
            <a href={linkUrl} target="_blank" rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-between rounded-2xl border border-[#e4eaf3] px-4 py-3 text-[15px] hover:bg-[#f8fafc]">
              원문 보기 <ChevronDown className="size-4 text-[#9ca3af]" />
            </a>
          )}
        </CardContent>
      </Card>

      {(recReason || issue.tags.length > 0) && (
        <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[18px]">
              <Sparkles className="size-5 text-[#1167e8]" />왜 추천됐나요?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl bg-[#f8faff] p-5">
              <p className="text-[14px] leading-relaxed text-[#344054]">
                {recReason?.description ?? "회원님의 관심사와 이 이슈의 핵심 키워드가 연결되어 추천되었어요."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(recReason?.tags ?? issue.tags).map((tag) => (
                  <span key={tag} className="rounded-full bg-[#eaf2ff] px-3 py-1 text-[13px] font-[600] text-[#1167e8]">{tag}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[18px]">
            <Vote className="size-5 text-[#1167e8]" />나에게 미치는 영향
          </CardTitle>
        </CardHeader>
        <CardContent>
          {impact ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-[12px] font-[700] text-[#344054]">
                  영향도: {IMPACT_LEVEL_LABEL[impact.impactLevel]}
                </span>
                <span className="rounded-full px-3 py-1 text-[12px] font-[700]"
                  style={{ background: IMPACT_TYPE_STYLE[impact.impactType].bg, color: IMPACT_TYPE_STYLE[impact.impactType].text }}>
                  {IMPACT_TYPE_STYLE[impact.impactType].label}
                </span>
              </div>
              <div className="rounded-2xl bg-[#f1f6ff] p-5 text-[15px] leading-relaxed text-[#344054]">{impact.description}</div>
              {impact.effects.length > 0 && (
                <ul className="space-y-1.5">
                  {impact.effects.map((e, i) => (
                    <li key={i} className="flex gap-2 text-[14px] text-[#344054]">
                      <span className="mt-0.5 text-[#1167e8]">✓</span>{e}
                    </li>
                  ))}
                </ul>
              )}
              {impact.uncertainty && <p className="text-[12px] text-[#9ca3af]">{impact.uncertainty}</p>}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#f8fafc] p-5 text-[14px] text-[#667085]">AI 영향 분석 결과가 없어요.</div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[18px]">
            <FileCheck className="size-5 text-[#1167e8]" />놓치면 안 되는 일정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl bg-[#f8fafc] p-5 space-y-3">
            {(keyDates?.dates ?? []).map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[14px] font-[600] text-[#344054]">{d.label}</span>
                <span className="text-[14px] font-[700] text-[#e03131]">{d.date === "상시" ? "상시" : `${d.date} (${d.dDay})`}</span>
              </div>
            ))}
            {(!keyDates || keyDates.dates.length === 0) && (
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-[600] text-[#344054]">참여 마감일</span>
                <span className="text-[14px] font-[700] text-[#e03131]">{issue.deadline || "상시"}</span>
              </div>
            )}
            {calSuggestion?.shouldSuggest && (
              <button onClick={handleCalendarAction} disabled={calendarLoading || calendarDone}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-[700] transition-colors disabled:opacity-60"
                style={{ background: calendarDone ? "#e8f5e9" : "#eaf2ff", color: calendarDone ? "#2f9e44" : "#1167e8" }}>
                {calendarDone ? "✓ 캘린더에 등록됨" : calendarLoading ? "등록 중..." : "📅 캘린더에 등록하기"}
              </button>
            )}
            {calSuggestion && !calSuggestion.shouldSuggest && (
              <p className="text-[13px] text-[#667085]">{calSuggestion.reason}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[18px]">
            <Eye className="size-5 text-[#1167e8]" />다음 행동 추천
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {actions.map((action, i) => (
              <div key={i}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e4eaf3] p-4 hover:bg-[#f8faff]"
                onClick={() => {
                  if (action.type === "view_original" && linkUrl) { window.open(linkUrl, "_blank"); return; }
                  comingSoon();
                }}
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[12px] font-[700] text-[#1167e8]">{i + 1}</span>
                <div>
                  <p className="text-[14px] font-[700] text-[#344054]">{action.label}</p>
                  <p className="mt-0.5 text-[13px] text-[#667085]">{action.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {missing?.needInfo && (
        <Card className="rounded-[20px] border-[#fde68a] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
          <CardContent className="p-5">
            <p className="mb-3 text-[13px] font-[700] text-[#e07b00]">더 정확한 분석을 위한 질문</p>
            <p className="mb-3 text-[14px] text-[#344054]">{missing.question}</p>
            <div className="flex flex-wrap gap-2">
              {missing.options.map((opt) => (
                <button key={opt} onClick={() => comingSoon("프로필 응답 반영은 준비 중이에요.")} className="rounded-full border border-[#e4eaf3] px-3 py-1 text-[13px] hover:border-[#1167e8] hover:bg-[#eaf2ff] hover:text-[#1167e8]">{opt}</button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── DetailProgress ────────────────────────────────────────
function DetailProgress() {
  const steps = [
    { label: "발의", done: true },
    { label: "위원회 회부", done: false },
    { label: "소위원회 회부", done: false },
    { label: "소위원회 심사", done: false },
    { label: "전체회의 의결", done: false },
  ];
  return (
    <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
      <CardHeader><CardTitle className="text-[18px]">진행 상황</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-5">
          {steps.map((step, i) => (
            <div key={step.label} className="rounded-2xl bg-[#f8fafc] p-3 text-center">
              <div className={`mx-auto mb-2 flex size-11 items-center justify-center rounded-full ${step.done ? "bg-[#1167e8] text-white" : "bg-[#d8dee8] text-white"}`}>
                <FileText className="size-5" />
              </div>
              <p className="text-[12px] font-[600]">{step.label}</p>
              <p className="text-[11px] text-[#9ca3af]">2025.05.{19 + i * 3}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── DetailSidebar ─────────────────────────────────────────
function DetailSidebar({ issue, progress, onHome, onOpen, allIssues }: {
  issue: Issue; progress: number; onHome: () => void; onOpen: (id: string) => void; allIssues: Issue[];
}) {
  const [similarIssues, setSimilarIssues] = useState<SimilarIssueDto[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [bmLoading, setBmLoading] = useState(false);
  const related = allIssues.filter((i) => i.id !== issue.id).slice(0, 3);

  useEffect(() => {
    getSimilarEvents(issue.id, BE_TYPE_MAP[issue.type] ?? "bill")
      .then(setSimilarIssues)
      .catch(() => {});
  }, [issue.id, issue.type]);

  // 북마크 여부 초기 동기화 (비로그인 시 401 → 무시)
  useEffect(() => {
    getBookmarks()
      .then((items) => setBookmarked(items.some((b) => b.eventId === issue.id)))
      .catch(() => setBookmarked(false));
  }, [issue.id]);

  const handleBookmark = async () => {
    if (bmLoading) return;
    setBmLoading(true);
    try {
      if (bookmarked) {
        await removeBookmark(issue.id);
        setBookmarked(false);
      } else {
        await addBookmark(issue.id, BE_TYPE_MAP[issue.type] ?? "bill", issue.title);
        setBookmarked(true);
      }
    } catch {
      alert("로그인이 필요하거나 요청에 실패했어요.");
    } finally {
      setBmLoading(false);
    }
  };

  return (
    <aside className="space-y-4">
      <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
        <CardContent className="p-6 text-center">
          <p className="font-[Inter] text-[19px] font-bold text-[#000000]">참여 마감까지</p>
          <p className="mt-1 text-[52px] font-[900] leading-none tracking-[-0.05em] text-[#e03131]">{issue.dday}</p>
          <p className="mt-1 text-[13px] text-[#9ca3af]">{issue.deadline} 까지</p>
          {issue.type === "청원" && (
            <Button
              onClick={() => window.open(issue.linkUrl ?? `https://petitions.assembly.go.kr/status/registered/${issue.billNumber}`, "_blank")}
              className="mt-5 w-full rounded-xl bg-[#1167e8] text-white">
              <MessageSquareText className="mr-2 size-4" />참여하기
            </Button>
          )}
          <Button
            onClick={handleBookmark}
            disabled={bmLoading}
            variant={bookmarked ? "default" : "outline"}
            className={`mt-2 w-full rounded-xl ${bookmarked ? "bg-[#1167e8] text-white" : ""}`}>
            <Bookmark className={`mr-2 size-4 ${bookmarked ? "fill-current" : ""}`} />
            {bookmarked ? "관심 이슈 담음" : "관심 이슈 담기"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-[Inter] font-bold text-[19px]">참여 현황</CardTitle>
            <span className="text-[13px] text-[#9ca3af] font-[500]">2026.5.30 기준</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mx-auto flex w-full h-48 items-center justify-center bg-white relative">
            <svg className="absolute top-0 left-1/2 -translate-x-1/2" width="300" height="200" viewBox="0 0 300 200">
              <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="#e4eaf3" strokeWidth="28" strokeLinecap="round" />
              <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="#1167e8" strokeWidth="28" strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 377} 377`} style={{ transition: 'stroke-dasharray 0.5s ease' }} />
            </svg>
            <div className="text-center absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2">
              <p className="text-[13px] text-[#9ca3af] font-[600]">현재 동의 수</p>
              <p className="text-[32px] font-[900] leading-tight mt-1">
                {issue.participants.toLocaleString()}<span className="text-[18px] font-[600] ml-1">명</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 text-center divide-x divide-[#e4eaf3]">
            {[
              { label: "목표", value: issue.goal.toLocaleString() },
              { label: "달성률", value: `${progress}%` },
              { label: "남음", value: (issue.goal - issue.participants).toLocaleString() },
            ].map((s) => (
              <div key={s.label} className="py-2">
                <p className="text-[11px] text-[#9ca3af] font-[600] mb-1">{s.label}</p>
                <p className="text-[20px] font-[800] text-[#344054]">{s.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
        <CardHeader><CardTitle className="text-[18px]">관련 정보</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {[
            ...(issue.type === "청원" || issue.linkUrl ? [{
              icon: Landmark,
              label: issue.type === "청원" ? "청원 원문 보기" : "법안 원문 보기",
              action: () => {
                const url = issue.type === "청원"
                  ? `https://petitions.assembly.go.kr/status/registered/${issue.billNumber}`
                  : issue.linkUrl!;
                window.open(url, "_blank");
              },
            }] : []),
            { icon: Share2, label: "공유하기", action: () => { navigator.clipboard.writeText(window.location.href); alert("링크가 복사되었습니다!"); } },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} className="flex w-full items-center justify-between rounded-xl p-3 hover:bg-[#f8fafc]" onClick={action}>
              <span className="flex items-center gap-2 text-[14px]"><Icon className="size-4 text-[#667085]" />{label}</span>
              <ChevronRight className="size-4 text-[#9ca3af]" />
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[18px]">
            <TrendingUp className="size-5 text-[#1167e8]" />함께 보면 좋은 이슈
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {similarIssues.length > 0 ? (
            similarIssues.map((sim, i) => (
              <div key={i} className="flex w-full flex-col rounded-xl border border-[#e4eaf3] p-3 text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="rounded-full bg-[#eaf2ff] px-2 py-0.5 text-[11px] font-semibold text-[#1167e8]">
                    {sim.type === "bill" ? "법안" : sim.type === "petition" ? "청원" : "입법예고"}
                  </span>
                  <span className="text-[11px] font-[600] text-[#e03131]">{sim.dDay}</span>
                </div>
                <p className="truncate text-[13px] font-[600]">{sim.title}</p>
                <p className="mt-0.5 text-[12px] text-[#9ca3af]">{sim.reason}</p>
              </div>
            ))
          ) : (
            related.map((rel) => (
              <button key={rel.id} onClick={() => onOpen(rel.id)}
                className="flex w-full items-center justify-between rounded-xl border border-[#e4eaf3] p-3 text-left hover:bg-[#eaf2ff]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-[600]">{rel.title}</p>
                  <p className="text-[12px] text-[#9ca3af]">{rel.type} · {rel.dday}</p>
                </div>
                <ChevronRight className="ml-2 size-4 shrink-0 text-[#9ca3af]" />
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <DetailProgress />
    </aside>
  );
}
