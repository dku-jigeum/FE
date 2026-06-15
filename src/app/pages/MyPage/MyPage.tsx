import { useEffect, useState } from "react";
import { LogOut, Bookmark, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { getProfile, updateProfile } from "../../../api/auth";
import { getBookmarks, removeBookmark, type BeBookmarkItem } from "../../../api/bookmarks";
import { INTEREST_TAGS, OCCUPATIONS, MAX_TAGS } from "../../../constants/profile";
import { TYPE_COLOR } from "../Home/HomePage";
import type { IssueType } from "../../../types/issue";

interface MyPageProps {
  onBack: () => void;
  onLogout: () => void;
  onOpenIssue: (id: string) => void;
}

// BE issueType("bill"/"petition"/"legislation") → 한글 라벨
const BE_TYPE_LABEL: Record<string, IssueType> = {
  bill: "법안", petition: "청원", legislation: "입법예고",
};

// 마이페이지 — 기본 정보(나이·직업·관심분야) 수정 + 관심 이슈(북마크) 목록.
// BE GET/PUT /api/users/profile, GET/DELETE /api/bookmarks 연동.
export function MyPage({ onBack, onLogout, onOpenIssue }: MyPageProps) {
  const [tab, setTab] = useState<"profile" | "bookmarks">("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [age, setAge] = useState<number | "">("");
  const [occupation, setOccupation] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setAge(p.age ?? "");
        setOccupation(p.occupation ?? "");
        setTags(p.interestTags ?? []);
      })
      .catch(() => setError("프로필을 불러오지 못했습니다. 온보딩을 먼저 완료해주세요."))
      .finally(() => setLoading(false));
  }, []);

  const toggleTag = (tag: string) => {
    setSaved(false);
    setTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, tag];
    });
  };

  const save = async () => {
    setError("");
    if (!age || Number(age) < 1) { setError("나이를 입력해주세요."); return; }
    if (!occupation) { setError("직업을 선택해주세요."); return; }
    if (tags.length === 0) { setError("관심 분야를 최소 1개 선택해주세요."); return; }

    setSaving(true);
    try {
      await updateProfile({ age: Number(age), occupation, interestTags: tags });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-8">
      <button onClick={onBack} className="text-[14px] text-[#667085] hover:text-[#1167e8]">← 홈으로 가기</button>
      <div className="mt-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-[900] tracking-[-0.04em]">마이페이지</h1>
          <p className="mt-1 text-[15px] text-[#667085]">기본 정보를 수정하면 맞춤 이슈 추천에 반영돼요.</p>
        </div>
        <Button variant="outline" onClick={onLogout} className="rounded-xl">
          <LogOut className="mr-2 size-4" />로그아웃
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "profile" | "bookmarks")} className="mb-6">
        <TabsList className="rounded-full bg-white px-1 py-1 shadow-[0_2px_8px_rgba(16,24,40,0.08)]">
          <TabsTrigger value="profile"
            className="rounded-full px-5 data-[state=active]:bg-[#1167e8] data-[state=active]:text-white data-[state=active]:shadow-sm">
            기본 정보
          </TabsTrigger>
          <TabsTrigger value="bookmarks"
            className="rounded-full px-5 data-[state=active]:bg-[#1167e8] data-[state=active]:text-white data-[state=active]:shadow-sm">
            관심 이슈
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "bookmarks" ? (
        <BookmarkList onOpenIssue={onOpenIssue} />
      ) : loading ? (
        <div className="py-20 text-center text-[#9ca3af]">불러오는 중…</div>
      ) : (
        <div className="space-y-5">
          {/* 나이 */}
          <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
            <CardHeader><CardTitle className="text-[18px]">나이</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <input
                  type="number" min={1} max={120}
                  value={age}
                  onChange={(e) => { setSaved(false); setAge(e.target.value === "" ? "" : Number(e.target.value)); }}
                  placeholder="00"
                  className="w-28 border-b-[3px] border-[#1167e8] bg-transparent pb-1 text-center text-[40px] font-[900] leading-none tracking-[-0.04em] text-[#111827] focus:outline-none placeholder-[#d0d5dd]"
                />
                <span className="mb-1.5 text-[20px] font-[800] text-[#344054]">세</span>
              </div>
            </CardContent>
          </Card>

          {/* 직업 */}
          <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
            <CardHeader><CardTitle className="text-[18px]">직업</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {OCCUPATIONS.map((occ) => {
                  const selected = occupation === occ;
                  return (
                    <button key={occ}
                      onClick={() => { setSaved(false); setOccupation(occ); }}
                      className={`rounded-2xl border-2 px-3 py-3 text-[14px] font-[700] transition-all hover:-translate-y-0.5 ${
                        selected
                          ? "border-transparent bg-[#04112e] text-white shadow-[0_6px_20px_rgba(4,17,46,0.2)]"
                          : "border-[#e4eaf3] bg-white text-[#344054] hover:border-[#1167e8]"
                      }`}>
                      {occ}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 관심 분야 */}
          <Card className="rounded-[20px] shadow-[0_6px_20px_rgba(16,24,40,0.07)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[18px]">관심 분야</CardTitle>
                <span className="text-[13px] font-[700] text-[#344054]">
                  선택 <span className="text-[#1167e8]">{tags.length}</span> / {MAX_TAGS}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {INTEREST_TAGS.map((label) => {
                  const selected = tags.includes(label);
                  const disabled = !selected && tags.length >= MAX_TAGS;
                  return (
                    <button key={label}
                      onClick={() => !disabled && toggleTag(label)}
                      disabled={disabled}
                      className={`rounded-2xl border-2 px-4 py-3 text-left text-[14px] font-[700] leading-tight transition-all ${
                        selected
                          ? "border-transparent bg-[#04112e] text-white shadow-[0_6px_20px_rgba(4,17,46,0.2)]"
                          : disabled
                          ? "border-[#e4eaf3] bg-white text-[#c0c7d0] cursor-not-allowed"
                          : "border-[#e4eaf3] bg-white text-[#344054] hover:border-[#1167e8] hover:-translate-y-0.5"
                      }`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {error && <p className="text-[13px] text-[#e03131]">⚠ {error}</p>}

          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-[14px] font-[700] text-[#2f9e44]">✓ 저장되었습니다</span>}
            <Button onClick={save} disabled={saving}
              className="rounded-xl bg-[#1167e8] px-7 text-white hover:bg-[#0b3fa0]">
              {saving ? "저장 중…" : "저장하기"}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

// ── 관심 이슈(북마크) 탭 ──────────────────────────────────
function BookmarkList({ onOpenIssue }: { onOpenIssue: (id: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BeBookmarkItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getBookmarks()
      .then(setItems)
      .catch(() => setError("관심 이슈를 불러오지 못했습니다. 로그인이 필요할 수 있어요."))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (eventId: string) => {
    const prev = items;
    setItems((cur) => cur.filter((b) => b.eventId !== eventId)); // 낙관적
    try {
      await removeBookmark(eventId);
    } catch {
      setItems(prev); // 롤백
      alert("삭제에 실패했어요.");
    }
  };

  if (loading) return <div className="py-20 text-center text-[#9ca3af]">불러오는 중…</div>;
  if (error) return <p className="py-20 text-center text-[13px] text-[#e03131]">⚠ {error}</p>;
  if (items.length === 0) {
    return (
      <div className="py-20 text-center text-[#9ca3af]">
        <Bookmark className="mx-auto mb-3 size-8 text-[#d0d5dd]" />
        아직 담은 관심 이슈가 없어요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((b) => {
        const label = BE_TYPE_LABEL[b.issueType] ?? "법안";
        const color = TYPE_COLOR[label];
        return (
          <Card key={b.eventId} className="rounded-[18px] shadow-[0_4px_14px_rgba(16,24,40,0.06)] transition-all hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-3 p-4">
              <button onClick={() => onOpenIssue(b.eventId)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className="shrink-0 rounded-full px-3 py-1 text-[12px] font-[700]" style={{ background: color.bg, color: color.text }}>
                  {label}
                </span>
                <span className="truncate text-[15px] font-[600] text-[#111827] group-hover:text-[#1167e8]">{b.title}</span>
              </button>
              <button onClick={() => remove(b.eventId)} title="관심 이슈에서 제외"
                className="shrink-0 rounded-lg p-2 text-[#9ca3af] hover:bg-[#fff0f0] hover:text-[#e03131]">
                <Trash2 className="size-4" />
              </button>
              <ChevronRight className="size-4 shrink-0 text-[#d0d5dd]" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
