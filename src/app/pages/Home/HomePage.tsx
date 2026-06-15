import { useEffect, useMemo, useState } from "react";
import {
  Bookmark, ChevronRight, Instagram, Sparkles, TrendingUp, Twitter, Youtube,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import logoImg from "../../../imports/____-1.png";
import type { Issue, IssueType } from "../../../types/issue";
import { getBookmarks, addBookmark, removeBookmark } from "../../../api/bookmarks";

// ── 공유 상수 ────────────────────────────────────────────
export const TYPE_COLOR: Record<IssueType, { bg: string; text: string }> = {
  "청원": { bg: "#fff0f0", text: "#e03131" },
  "입법예고": { bg: "#f0f4ff", text: "#1167e8" },
  "법안": { bg: "#f0fdf4", text: "#2f9e44" },
};

// FE 이슈 타입 → BE issueType
export const BE_TYPE_MAP: Record<IssueType, string> = {
  "법안": "bill", "청원": "petition", "입법예고": "legislation",
};

// 트렌딩 항목의 인기 지표 라벨 (타입별 의미가 달라 분기)
function trendingMetric(issue: Issue): string {
  if (issue.type === "청원") return `${issue.participants.toLocaleString()}명 참여`;
  if (issue.type === "법안") return `조회 ${issue.participants.toLocaleString()}회`;
  return issue.dday; // 입법예고: 마감일 기준
}

// ── Props ─────────────────────────────────────────────────
type HomeFilter = "전체" | IssueType | "AI추천";
interface HomePageProps {
  liveIssues: Issue[];
  trendingIssues: Issue[];          // BE 조회수·참여수 기반 트렌딩 Top-N
  onOpen: (id: string) => void;
  query: string;
  activeType: HomeFilter;            // App에서 끌어올려 네비 필터와 공유
  onTypeChange: (t: HomeFilter) => void;
  onOpenChat: () => void;            // 플로팅 챗봇 열기
  onOpenMyPage: () => void;          // 마이페이지 열기
}

// 아직 별도 화면/BE가 없어 동작을 붙일 수 없는 항목 안내
const comingSoon = () => alert("아직 준비 중인 기능이에요.");

export function HomePage({ liveIssues, trendingIssues, onOpen, query, activeType, onTypeChange, onOpenChat, onOpenMyPage }: HomePageProps) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // 진입 시 내 북마크 동기화 (비로그인 시 401 → 무시)
  useEffect(() => {
    getBookmarks()
      .then((items) => setBookmarkedIds(new Set(items.map((b) => b.eventId))))
      .catch(() => {});
  }, []);

  // 트렌딩 엔드포인트 실패/빈 응답 시 현재 이슈 상위로 폴백 (빈 화면 방지)
  const trend = trendingIssues.length > 0 ? trendingIssues : liveIssues.slice(0, 9);
  const topTrendingId = trend[0]?.id ?? liveIssues[0]?.id ?? "";

  const filteredIssues = useMemo(() => {
    return liveIssues.filter((issue) => {
      if (activeType === "AI추천") {
        return issue.aiRecommended &&
          `${issue.title} ${issue.summary} ${issue.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
      }
      const typeMatch = activeType === "전체" || issue.type === activeType;
      const queryMatch = `${issue.title} ${issue.summary} ${issue.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
      return typeMatch && queryMatch;
    });
  }, [activeType, query, liveIssues]);

  // 낙관적 토글 + BE 반영, 실패 시 롤백
  const toggleBookmark = async (issue: Issue) => {
    const id = issue.id;
    const wasBookmarked = bookmarkedIds.has(id);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      wasBookmarked ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      if (wasBookmarked) await removeBookmark(id);
      else await addBookmark(id, BE_TYPE_MAP[issue.type], issue.title);
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        wasBookmarked ? next.add(id) : next.delete(id);
        return next;
      });
      alert("로그인이 필요하거나 요청에 실패했어요.");
    }
  };

  return (
    <main>
      <SuperBanner trend={trend} onPrimary={() => topTrendingId && onOpen(topTrendingId)} onFindWithAI={onOpenChat} />
      <IssueSection
        issues={filteredIssues}
        activeType={activeType}
        onTypeChange={onTypeChange}
        onOpen={onOpen}
        onOpenChat={onOpenChat}
        bookmarkedIds={bookmarkedIds}
        onToggleBookmark={toggleBookmark}
      />
      <TrendingSection trend={trend} onOpen={onOpen} />
      <StatsBanner liveIssues={liveIssues} />
      <Footer onTypeChange={onTypeChange} onOpenChat={onOpenChat} onOpenMyPage={onOpenMyPage} />
    </main>
  );
}

// ── SuperBanner ───────────────────────────────────────────
function SuperBanner({ trend, onPrimary, onFindWithAI }: { trend: Issue[]; onPrimary: () => void; onFindWithAI: () => void }) {
  return (
    <section className="bg-[linear-gradient(135deg,#04112e_0%,#0b3fa0_55%,#1167e8_100%)]">
      <div className="mx-auto max-w-[1200px] px-5 py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="ml-6 text-white">
            <h1 className="text-[42px] font-[900] leading-[1.25] tracking-[-0.05em] sm:text-[52px]">
              당신의 참여가<br /><span className="text-[#63b3ed]">세상을</span> 바꿉니다
            </h1>
            <p className="mt-5 text-[17px] leading-relaxed text-white/75">
              청원부터 입법예고, 법안 진행 상황까지<br className="hidden sm:block" />
              한 화면에서 이해하고 의견을 남기는 시민 참여 플랫폼입니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={onPrimary} className="rounded-full bg-white px-7 py-3 text-[15px] font-[700] text-[#1167e8] shadow-lg hover:bg-white/90">
                지금 참여하기 →
              </Button>
              <Button onClick={onFindWithAI} variant="ghost" className="rounded-full border border-white/30 px-7 py-3 text-[15px] font-[600] text-white hover:bg-white/15">
                AI로 이슈 찾기
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="-ml-16 rounded-[24px] bg-white/10 px-6 py-3 backdrop-blur">
              <p className="mb-4 mt-3 text-white/60 uppercase tracking-widest font-[Inter] font-bold text-[18px]">오늘의 참여 Top 5</p>
              <ul className="divide-y divide-white/10">
                {trend.slice(0, 5).map((item, i) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-[800] ${i < 3 ? "bg-[#1167e8] text-white" : "bg-white/20 text-white"}`}>
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px] text-white/90">{item.title}</span>
                    <span className="shrink-0 text-[11px] text-white/50">{trendingMetric(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── IssueSection + IssueCard ──────────────────────────────
function IssueSection({ issues: list, activeType, onTypeChange, onOpen, onOpenChat, bookmarkedIds, onToggleBookmark }: {
  issues: Issue[];
  activeType: "전체" | IssueType | "AI추천";
  onTypeChange: (t: "전체" | IssueType | "AI추천") => void;
  onOpen: (id: string) => void;
  onOpenChat: () => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (issue: Issue) => void;
}) {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-10">
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <button type="button" onClick={onOpenChat}
          className="flex items-center justify-between rounded-[20px] bg-[linear-gradient(120deg,#1167e8,#0b3fa0)] p-5 text-left text-white transition-transform hover:-translate-y-0.5">
          <div>
            <p className="text-[12px] font-[600] text-white/60 uppercase tracking-widest">AI 추천</p>
            <p className="mt-1 text-[18px] font-[750] tracking-[-0.03em]">AI 해결사에게<br />질문하기</p>
          </div>
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15">
            <Sparkles className="size-7 text-white" />
          </div>
        </button>
        <button type="button" onClick={() => onTypeChange("AI추천")}
          className="flex items-center justify-between rounded-[20px] bg-white p-5 text-left shadow-[0_8px_24px_rgba(16,24,40,0.07)] transition-transform hover:-translate-y-0.5">
          <div>
            <p className="text-[12px] font-[600] text-[#667085] uppercase tracking-widest">관련 이슈</p>
            <p className="mt-1 text-[18px] font-[750] tracking-[-0.03em]">내 관심 분야<br />맞춤 이슈 보기</p>
          </div>
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#eaf2ff]">
            <TrendingUp className="size-7 text-[#1167e8]" />
          </div>
        </button>
      </div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Tabs value={activeType} onValueChange={(v) => onTypeChange(v as "전체" | IssueType | "AI추천")}>
          <TabsList className="rounded-full bg-white px-1 py-1 shadow-[0_2px_8px_rgba(16,24,40,0.08)]">
            {(["전체", "청원", "입법예고", "법안", "AI추천"] as const).map((item) => (
              <TabsTrigger key={item} value={item}
                className="rounded-full px-5 data-[state=active]:bg-[#1167e8] data-[state=active]:text-white data-[state=active]:shadow-sm">
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-[14px] text-[#667085]">총 {list.length}건</p>
      </div>
      {list.length === 0 ? (
        <div className="py-20 text-center text-[#9ca3af]">검색 결과가 없습니다.</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid auto-cols-[320px] grid-flow-col grid-rows-2 gap-4">
            {list.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onOpen={() => onOpen(issue.id)}
                onToggleBookmark={() => onToggleBookmark(issue)} bookmarked={bookmarkedIds.has(issue.id)} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function IssueCard({ issue, onOpen, onToggleBookmark, bookmarked }: {
  issue: Issue; onOpen: () => void; onToggleBookmark: () => void; bookmarked: boolean;
}) {
  const value = issue.goal > 0 ? Math.min(100, Math.round((issue.participants / issue.goal) * 100)) : 0;
  const typeStyle = TYPE_COLOR[issue.type];
  const urgent = issue.dnum <= 7;

  return (
    <Card className="group flex h-[300px] cursor-pointer flex-col rounded-[24px] border-[#e4eaf3] bg-white shadow-[0_6px_20px_rgba(16,24,40,0.07)] transition-all hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(16,24,40,0.12)] relative"
      onClick={onOpen}>
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full px-3 py-1 text-[12px] font-[700]" style={{ background: typeStyle.bg, color: typeStyle.text }}>
            {issue.type}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-[700] ${urgent ? "text-[#e03131]" : "text-[#667085]"}`}>{issue.dday}</span>
            <Bookmark
              className={`size-5 cursor-pointer ${bookmarked ? "fill-[#1167e8] text-[#1167e8]" : "text-[#9ca3af]"} transition-colors hover:text-[#1167e8]`}
              onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
            />
          </div>
        </div>
        <h3 className="mb-2 leading-snug tracking-[-0.03em] group-hover:text-[#1167e8] font-[Inter] font-bold text-[16px] line-clamp-2">{issue.title}</h3>
        <p className="mb-4 text-[14px] leading-relaxed text-[#667085] font-[Inter] line-clamp-3">{issue.summary}</p>
        <div className="mt-auto space-y-2">
          <div className="flex justify-between text-[13px] text-[#9ca3af]">
            <span className="font-[Inter]">{issue.participants.toLocaleString()}명 참여</span>
            <span className="font-[Inter]">{value}%</span>
          </div>
          <Progress value={value} className="h-1.5" />
        </div>
        <Button className="mt-4 w-full rounded-xl bg-[#1167e8] text-white hover:bg-[#0b3fa0]"
          onClick={(e) => { e.stopPropagation(); onOpen(); }}>참여하기</Button>
      </CardContent>
    </Card>
  );
}

// ── TrendingSection ───────────────────────────────────────
function TrendingSection({ trend, onOpen }: { trend: Issue[]; onOpen: (id: string) => void }) {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="size-6 text-[#1167e8]" />
          <h2 className="text-[24px] font-[800] tracking-[-0.04em]">지금 뜨는 트렌딩 이슈</h2>
        </div>
        {trend.length === 0 ? (
          <div className="py-12 text-center text-[#9ca3af]">트렌딩 이슈를 불러오는 중입니다.</div>
        ) : (
          <div className="space-y-3">
            {trend.map((item, i) => (
              <button key={item.id} onClick={() => onOpen(item.id)}
                className="flex w-full items-center gap-5 rounded-2xl border border-[#e4eaf3] bg-[#f8fafc] px-5 py-4 text-left transition hover:border-[#1167e8] hover:bg-[#eaf2ff]">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[16px] font-[900] ${i < 3 ? "bg-[#1167e8] text-white" : "bg-[#e4eaf3] text-[#667085]"}`}>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-[16px] font-[600] tracking-[-0.02em]">{item.title}</span>
                <span className="shrink-0 text-[14px] text-[#9ca3af]">{trendingMetric(item)}</span>
                <ChevronRight className="size-4 shrink-0 text-[#9ca3af]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── StatsBanner ───────────────────────────────────────────
function StatsBanner({ liveIssues }: { liveIssues: Issue[] }) {
  const total = liveIssues.reduce((sum, i) => sum + i.participants, 0);
  const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M'
    : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.?0+$/, '') + 'K' : String(n);

  return (
    <section className="bg-[linear-gradient(135deg,#04112e_0%,#0b3fa0_60%,#1167e8_100%)] py-16 text-white">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="ml-6">
            <p className="mb-3 text-[13px] font-[600] text-white/60 uppercase tracking-widest">함께 만드는 변화</p>
            <h2 className="text-[34px] font-[900] leading-tight tracking-[-0.04em] sm:text-[40px]">함께 더 나은 사회를<br />만들어가요</h2>
            <p className="mt-4 text-[16px] text-white/70">지금참여와 함께 더 나은 사회를 만들어 보세요.</p>
            <Button onClick={comingSoon} className="mt-7 rounded-full bg-white px-8 text-[15px] font-[700] text-[#1167e8] hover:bg-white/90">
              참여 방법 알아보기 →
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "누적 참여자", value: fmt(total), emoji: "👥" },
              { label: "진행된 이슈", value: fmt(liveIssues.length), emoji: "📋" },
              { label: "누적 동의수", value: fmt(total), emoji: "👍" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[24px] bg-white/15 px-4 py-10 backdrop-blur-sm">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-white/20 p-3 text-[32px] leading-none">{stat.emoji}</div>
                </div>
                <p className="text-[32px] font-[900] tracking-[-0.04em] leading-none">{stat.value}</p>
                <p className="mt-3 text-[13px] text-white/60 font-[500]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────
function Footer({ onTypeChange, onOpenChat, onOpenMyPage }: {
  onTypeChange: (t: HomeFilter) => void; onOpenChat: () => void; onOpenMyPage: () => void;
}) {
  // "서비스" 링크만 실제 동작 연결, 나머지(도움말·정책·소셜)는 보류 안내
  const serviceLink: Record<string, () => void> = {
    "이슈탐색": () => onTypeChange("전체"),
    "청원광장": () => onTypeChange("청원"),
    "AI 상담": onOpenChat,
    "내 활동": onOpenMyPage,
  };
  const sections = [
    { title: "서비스", links: ["이슈탐색", "청원광장", "AI 상담", "내 활동"] },
    { title: "도움말", links: ["이용안내", "자주 묻는 질문", "공지사항", "문의하기"] },
    { title: "정책", links: ["이용약관", "개인정보처리방침"] },
  ];

  return (
    <footer className="border-t border-[#e4eaf3] bg-[#f8fafc] py-12">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ImageWithFallback src={logoImg} alt="지금참여" className="size-8 rounded-lg object-contain" />
              <span className="text-[18px] font-[800] tracking-[-0.04em]">지금참여</span>
            </div>
            <p className="text-[14px] leading-relaxed text-[#667085]">시민이 직접 참여하는<br />정책 참여 플랫폼</p>
            <div className="mt-4 flex gap-3 text-[#9ca3af]">
              <Instagram onClick={comingSoon} className="size-5 cursor-pointer hover:text-[#1167e8]" />
              <Twitter onClick={comingSoon} className="size-5 cursor-pointer hover:text-[#1167e8]" />
              <Youtube onClick={comingSoon} className="size-5 cursor-pointer hover:text-[#1167e8]" />
            </div>
          </div>
          {sections.map((sec) => (
            <div key={sec.title}>
              <p className="mb-3 font-[700] text-[#344054] uppercase tracking-wider text-[15px]">{sec.title}</p>
              <ul className="space-y-2">
                {sec.links.map((link) => (
                  <li key={link}>
                    <button onClick={sec.title === "서비스" ? serviceLink[link] : comingSoon}
                      className="text-[#667085] hover:text-[#1167e8] text-[13px]">{link}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-[#e4eaf3] pt-6 text-center text-[13px] text-[#9ca3af]">
          © 2026 지금참여. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
