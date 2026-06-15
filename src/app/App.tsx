import { useState } from "react";
import {
  Bell, Bookmark, CalendarDays, ChevronDown, ChevronRight, CircleUserRound, Search,
} from "lucide-react";
import { Input } from "./components/ui/input";
import logoImg from "../imports/____-1.png";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { LoginPage } from "./pages/Login/LoginPage";
import { OnboardingPage } from "./pages/Onboarding/OnboardingPage";
import { AgentAnalysisScreen } from "./pages/IssueDetail/AgentAnalysisScreen";
import { HomePage } from "./pages/Home/HomePage";
import { DetailPage } from "./pages/IssueDetail/DetailPage";
import { CalendarPage } from "./pages/Calendar/CalendarPage";
import { MyPage } from "./pages/MyPage/MyPage";
import { ChatWidget } from "./components/ChatWidget";
import { clearToken } from "../api/client";
import { useIssues } from "../hooks/useIssues";
import { useTrending } from "../hooks/useTrending";
import { useChat } from "../hooks/useChat";
import type { IssueType } from "../types/issue";
import { mockIssues } from "../mocks/issues";
import type { DetailPageAnalysisResponse } from "../api/agent";

/* MARKER-MAKE-KIT-INVOKED */

type AppScreen = "login" | "onboarding" | "home" | "agent" | "calendar" | "mypage";

const issues = mockIssues;

const BE_TYPE_MAP: Record<string, string> = {
  "법안": "bill", "청원": "petition", "입법예고": "legislation",
};

const NAV_ITEM_W = 120;

// 홈 탭 필터 값 (HomePage activeType와 동일 도메인)
export type HomeFilter = "전체" | IssueType | "AI추천";
// 네비/푸터 항목이 클릭 시 수행할 동작.
// - filter: 홈으로 이동 + 해당 탭 필터 적용
// - chat:   챗봇 열기
// - mypage: 마이페이지(기본 정보 수정)
// - soon:   별도 화면 필요(알림·동의 기록 등) — 아직 미구현 placeholder
export type NavAction =
  | { kind: "filter"; filter: HomeFilter }
  | { kind: "chat" }
  | { kind: "mypage" }
  | { kind: "soon" };

type NavEntry = { label: string; action: NavAction; sub: { label: string; action: NavAction }[] };

// 청원광장/입법예고의 세부 하위 항목(마감 임박·신규 예고 등)은 현재 BE 필터가 없어
// 동일 타입 필터로 수렴시킨다. 마이페이지/알림 계열은 soon으로 보류.
const navItems: NavEntry[] = [
  { label: "이슈탐색", action: { kind: "filter", filter: "전체" }, sub: [
    { label: "청원 목록", action: { kind: "filter", filter: "청원" } },
    { label: "입법예고 목록", action: { kind: "filter", filter: "입법예고" } },
    { label: "법안 목록", action: { kind: "filter", filter: "법안" } },
    { label: "AI 추천", action: { kind: "filter", filter: "AI추천" } },
  ] },
  { label: "청원광장", action: { kind: "filter", filter: "청원" }, sub: [
    { label: "현재 진행중", action: { kind: "filter", filter: "청원" } },
    { label: "마감 임박", action: { kind: "filter", filter: "청원" } },
    { label: "인기 청원", action: { kind: "filter", filter: "청원" } },
    { label: "내 청원", action: { kind: "soon" } },
  ] },
  { label: "입법예고", action: { kind: "filter", filter: "입법예고" }, sub: [
    { label: "신규 예고", action: { kind: "filter", filter: "입법예고" } },
    { label: "의견 제출", action: { kind: "filter", filter: "입법예고" } },
    { label: "마감 예정", action: { kind: "filter", filter: "입법예고" } },
    { label: "완료", action: { kind: "filter", filter: "입법예고" } },
  ] },
  { label: "AI 상담", action: { kind: "chat" }, sub: [
    { label: "이슈 분석", action: { kind: "chat" } },
    { label: "맞춤 추천", action: { kind: "chat" } },
    { label: "영향 분석", action: { kind: "chat" } },
    { label: "비교 분석", action: { kind: "chat" } },
  ] },
  { label: "내 활동", action: { kind: "mypage" }, sub: [
    { label: "내 정보 수정", action: { kind: "mypage" } },
    { label: "관심 분야", action: { kind: "mypage" } },
    { label: "동의한 청원", action: { kind: "soon" } },
    { label: "알림", action: { kind: "soon" } },
  ] },
];

function App() {
  const initialScreen: AppScreen = localStorage.getItem("token") ? "home" : "login";
  const [screen, setScreen] = useState<AppScreen>(initialScreen);
  const [view, setView] = useState<"home" | "detail">("home");
  const [selectedId, setSelectedId] = useState("youth-rent");
  const [agentKey, setAgentKey] = useState(0);
  const [issueRefreshKey, setIssueRefreshKey] = useState(0);
  const [agentResult, setAgentResult] = useState<DetailPageAnalysisResponse | null>(null);
  const [query, setQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [homeFilter, setHomeFilter] = useState<HomeFilter>("전체");
  const chat = useChat();

  const { issues: apiIssues, usingMock } = useIssues(issueRefreshKey);
  const trendingIssues = useTrending(9, issueRefreshKey);
  const liveIssues = apiIssues.length > 0 ? apiIssues : issues;
  const selectedIssue = liveIssues.find((i) => i.id === selectedId) ?? liveIssues[0] ?? issues[0];
  const progress = selectedIssue.goal > 0
    ? Math.min(100, Math.round((selectedIssue.participants / selectedIssue.goal) * 100))
    : 0;

  const openDetail = (id: string) => {
    setSelectedId(id);
    setAgentKey((k) => k + 1);
    setAgentResult(null);
    setScreen("agent");
  };

  const handleLogout = () => { clearToken(); setScreen("login"); };
  const openCalendar = () => setScreen("calendar");
  const openChat = () => setChatOpen(true);
  const openMyPage = () => setScreen("mypage");

  // 네비/푸터 항목 클릭 → 홈 필터 적용 · 챗봇 열기 · 마이페이지 · 보류 안내
  const handleNav = (action: NavAction) => {
    if (action.kind === "chat") { openChat(); return; }
    if (action.kind === "mypage") { openMyPage(); return; }
    if (action.kind === "soon") { alert("아직 준비 중인 기능이에요."); return; }
    setScreen("home");
    setView("home");
    setHomeFilter(action.filter);
  };

  // 상시 챗봇 — 대화 상태는 useChat가 보유해 화면 전환에도 유지된다.
  // ctx가 있으면 현재 이슈를 답변 컨텍스트로 주입한다.
  const renderChat = (ctx?: { id: string; type: string; title: string }) => (
    <ChatWidget
      open={chatOpen}
      onOpenChange={setChatOpen}
      messages={chat.messages}
      loading={chat.loading}
      onSend={(q) => chat.send(q, ctx?.id, ctx?.type)}
      issueTitle={ctx?.title}
      onOpenSource={openDetail}
    />
  );
  const issueCtx = () => ({
    id: selectedIssue.id,
    type: BE_TYPE_MAP[selectedIssue.type] ?? "bill",
    title: selectedIssue.title,
  });

  if (screen === "login") return <LoginPage onSuccess={(isNew) => { setIssueRefreshKey((k) => k + 1); setScreen(isNew ? "onboarding" : "home"); }} />;
  if (screen === "onboarding") return <OnboardingPage onComplete={() => setScreen("home")} />;

  if (screen === "calendar") {
    return (
      <div className="min-h-screen bg-[#f4f7fc] text-[#111827]">
        <Header onHome={() => { setScreen("home"); setView("home"); }} query={query} onQuery={setQuery} onMyPage={openMyPage} onCalendar={openCalendar} onNav={handleNav} />
        <CalendarPage
          onBack={() => setScreen("home")}
          onOpenIssue={(id) => openDetail(id)}
        />
        {renderChat()}
      </div>
    );
  }

  if (screen === "mypage") {
    return (
      <div className="min-h-screen bg-[#f4f7fc] text-[#111827]">
        <Header onHome={() => { setScreen("home"); setView("home"); }} query={query} onQuery={setQuery} onMyPage={openMyPage} onCalendar={openCalendar} onNav={handleNav} />
        <MyPage onBack={() => { setScreen("home"); setView("home"); }} onLogout={handleLogout} onOpenIssue={openDetail} />
        {renderChat()}
      </div>
    );
  }

  if (screen === "agent") {
    return (
      <>
        <AgentAnalysisScreen
          key={agentKey}
          issueId={selectedIssue.id}
          issueType={BE_TYPE_MAP[selectedIssue.type] ?? "bill"}
          issueTitle={selectedIssue.title}
          dnum={selectedIssue.dnum}
          onComplete={(_ok, result) => {
            setAgentResult(result ?? null);
            setScreen("home");
            setView("detail");
          }}
        />
        {renderChat(issueCtx())}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-[#111827]">
      {usingMock && (
        <div className="flex items-center justify-center gap-2 bg-red-600 py-2 text-[13px] font-[700] text-white">
          <span>🚫</span><span>BE 미연결 — [테스트] Mock 데이터 표시 중</span>
        </div>
      )}
      {!usingMock && (
        <div className="flex items-center justify-center gap-2 bg-green-600 py-2 text-[13px] font-[700] text-white">
          <span>✅</span><span>실제 API 연결됨 — 실데이터</span>
        </div>
      )}
      <Header onHome={() => setView("home")} query={query} onQuery={setQuery} onMyPage={openMyPage} onCalendar={openCalendar} onNav={handleNav} />
      {view === "home" ? (
        <HomePage liveIssues={liveIssues} trendingIssues={trendingIssues} onOpen={openDetail} query={query}
          activeType={homeFilter} onTypeChange={setHomeFilter} onOpenChat={openChat} onOpenMyPage={openMyPage} />
      ) : (
        <DetailPage
          issue={selectedIssue}
          progress={progress}
          onHome={() => setView("home")}
          onOpen={openDetail}
          agentResult={agentResult}
          allIssues={liveIssues}
        />
      )}
      {renderChat(view === "detail" ? issueCtx() : undefined)}
    </div>
  );
}

// ── Header (홈/상세 공유 레이아웃) ────────────────────────
function NavItem({ item, hovered, onEnter, onSelect }: {
  item: NavEntry; hovered: boolean; onEnter: () => void; onSelect: () => void;
}) {
  return (
    <button onMouseEnter={onEnter} onClick={onSelect} style={{ width: NAV_ITEM_W }}
      className={`relative flex h-full items-center justify-center text-[15px] font-[500] transition-colors ${hovered ? "text-[#1167e8]" : "text-[#344054]"}`}>
      <span className="relative">
        {item.label}
        <span className={`absolute left-0 top-[calc(100%+3px)] h-[3px] w-full origin-left rounded-full bg-[#1167e8] transition-transform duration-200 ${hovered ? "scale-x-100" : "scale-x-0"}`} />
      </span>
    </button>
  );
}

function NavMegaMenu({ navOpen, onNav }: { navOpen: boolean; onNav: (a: NavAction) => void }) {
  return (
    <div style={{ width: NAV_ITEM_W * navItems.length }}
      className={`absolute left-0 top-[calc(100%+2px)] z-[999] transition-all duration-150 ${navOpen ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-1"}`}>
      <div className="flex overflow-hidden rounded-[18px] border border-[#e4eaf3] bg-white shadow-[0_16px_48px_rgba(16,24,40,0.14)]">
        {navItems.map((item, idx) => (
          <div key={item.label} style={{ width: NAV_ITEM_W }} className={`shrink-0 pb-3 pt-4 ${idx < navItems.length - 1 ? "border-r border-[#f0f3f9]" : ""}`}>
            <p className="px-4 pb-1 text-[11px] font-[700] uppercase tracking-widest text-[#9ca3af]">{item.label}</p>
            {item.sub.map((sub) => (
              <button key={sub.label} onClick={() => onNav(sub.action)} className="group/sub relative flex w-full items-center px-4 py-2 text-[14px] text-[#344054] transition-colors hover:bg-[#f4f7fc] hover:text-[#1167e8]">
                <span className="absolute left-0 top-0 h-full w-[3px] origin-center scale-y-0 rounded-r-full bg-[#1167e8] transition-transform duration-150 group-hover/sub:scale-y-100" />
                {sub.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ onHome, query, onQuery, onMyPage, onCalendar, onNav }: {
  onHome: () => void; query: string; onQuery: (v: string) => void; onMyPage: () => void; onCalendar: () => void; onNav: (a: NavAction) => void;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState("");

  return (
    <header className="sticky top-0 z-20 border-b border-[#e4eaf3] bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5"
        onMouseLeave={() => { setNavOpen(false); setHoveredNav(""); }}>
        <div className="flex items-center gap-8">
          <button onClick={onHome} className="flex shrink-0 items-center gap-3 hover:opacity-80 transition-opacity">
            <ImageWithFallback src={logoImg} alt="지금참여 로고" className="size-9 rounded-xl object-contain" />
            <span className="tracking-[-0.01em] p-[0px] m-[0px] font-[Inter] text-[26px] font-bold">지금참여</span>
          </button>
          <nav className="relative hidden h-16 items-center md:flex">
            {navItems.map((item) => (
              <NavItem key={item.label} item={item} hovered={hoveredNav === item.label}
                onEnter={() => { setNavOpen(true); setHoveredNav(item.label); }}
                onSelect={() => { setNavOpen(false); onNav(item.action); }} />
            ))}
            <NavMegaMenu navOpen={navOpen} onNav={onNav} />
          </nav>
        </div>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
          <Input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="이슈 검색"
            className="w-[220px] rounded-full border-[#e4eaf3] bg-[#f8fafc] pl-9 text-[14px]" />
        </div>
        <div className="flex items-center gap-5 text-[#344054]">
          <Bell className="size-5 cursor-pointer hover:text-[#1167e8] transition-colors" />
          <Bookmark className="size-5 cursor-pointer hover:text-[#1167e8] transition-colors" />
          <button onClick={onCalendar} title="내 캘린더" className="hover:text-[#1167e8] transition-colors">
            <CalendarDays className="size-5" />
          </button>
          <button onClick={onMyPage} title="마이페이지" className="flex items-center gap-2 hover:text-[#1167e8] transition-colors">
            <CircleUserRound className="size-5" />
            <span className="hidden text-[13px] font-[500] sm:inline">마이페이지</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ChevronDown 참조 유지 (Header sub-menu에서 사용되지 않지만 import 경고 방지)
const _cd = ChevronDown;
void _cd;
const _cr = ChevronRight;
void _cr;

export default App;
