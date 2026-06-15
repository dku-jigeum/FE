import { useState } from "react";
import { createProfile } from "../../../api/auth";
import { INTEREST_TAGS, OCCUPATIONS, MAX_TAGS } from "../../../constants/profile";

interface OnboardingPageProps {
  onComplete: () => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState<number | "">("");
  const [occupation, setOccupation] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, tag];
    });
  };

  const next = () => {
    setError("");
    if (step === 1 && (!age || Number(age) < 1)) { setError("나이를 입력해주세요."); return; }
    if (step === 2 && !occupation) { setError("직업을 선택해주세요."); return; }
    setStep((s) => s + 1);
  };

  const complete = async () => {
    if (!selectedTags.length) { setError("최소 1개 이상 선택해주세요."); return; }
    setError(""); setLoading(true);
    try {
      await createProfile({ age: Number(age), occupation, interestTags: selectedTags });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally { setLoading(false); }
  };

  const canProceed =
    (step === 1 && !!age && Number(age) >= 1) ||
    (step === 2 && !!occupation) ||
    (step === 3 && selectedTags.length > 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7fc]">
      {/* 헤더 */}
      <header className="border-b border-[#e4eaf3] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#1167e8]">
              <span className="text-[12px] font-[900] text-white">지</span>
            </div>
            <span className="text-[15px] font-[800] tracking-[-0.03em] text-[#111827]">지금참여</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`rounded-full transition-all duration-300 ${
                n === step ? "h-2 w-6 bg-[#1167e8]" : n < step ? "size-2 bg-[#1167e8]/40" : "size-2 bg-[#e4eaf3]"
              }`} />
            ))}
            <span className="ml-2 text-[13px] text-[#9ca3af]">{step} / 3</span>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="mx-auto w-full max-w-[760px] flex-1 px-6 py-12 pb-28">

        {/* Step 1 — 나이 */}
        {step === 1 && (
          <div>
            <h2 className="text-[28px] font-[900] tracking-[-0.04em] text-[#111827]">나이를 알려주세요</h2>
            <p className="mt-1.5 text-[15px] text-[#667085]">맞춤 이슈 추천에 활용됩니다</p>
            <div className="mt-10 flex items-end gap-4">
              <input
                type="number" min={1} max={120}
                value={age}
                onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="00"
                className="w-36 border-b-[3px] border-[#1167e8] bg-transparent pb-2 text-[72px] font-[900] text-center leading-none tracking-[-0.05em] text-[#111827] focus:outline-none placeholder-[#d0d5dd]"
              />
              <span className="mb-3 text-[28px] font-[800] text-[#344054]">세</span>
            </div>
          </div>
        )}

        {/* Step 2 — 직업 */}
        {step === 2 && (
          <div>
            <h2 className="text-[28px] font-[900] tracking-[-0.04em] text-[#111827]">직업을 선택해주세요</h2>
            <p className="mt-1.5 text-[15px] text-[#667085]">맞춤 이슈 추천에 활용됩니다</p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {OCCUPATIONS.map((occ, i) => {
                const selected = occupation === occ;
                return (
                  <button
                    key={occ}
                    onClick={() => { setOccupation(occ); setError(""); }}
                    className={`relative rounded-2xl border-2 px-4 py-5 text-left transition-all hover:-translate-y-0.5 ${
                      selected
                        ? "border-transparent bg-[#04112e] text-white shadow-[0_6px_20px_rgba(4,17,46,0.2)]"
                        : "border-[#e4eaf3] bg-white text-[#344054] hover:border-[#1167e8]"
                    }`}
                  >
                    {selected && (
                      <div className="mb-2 flex size-6 items-center justify-center rounded-md bg-[#1167e8]">
                        <span className="text-[10px] font-[900] text-white">✓</span>
                      </div>
                    )}
                    {!selected && (
                      <p className="mb-2 text-[11px] font-[700] text-[#9ca3af]">
                        {String(i + 1).padStart(2, "0")}
                      </p>
                    )}
                    <p className="text-[15px] font-[700]">{occ}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3 — 관심분야 */}
        {step === 3 && (
          <div>
            <h2 className="text-[28px] font-[900] tracking-[-0.04em] text-[#111827]">
              어떤 사회 이슈에 관심이 있으세요?
            </h2>
            <p className="mt-1.5 text-[15px] text-[#667085]">
              선택한 주제와 관련된 법안·청원·입법예고를 우선 추천해 드릴게요.{" "}
              <span className="font-[700] text-[#111827]">최대 {MAX_TAGS}개</span>까지 선택할 수 있어요.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {INTEREST_TAGS.map((label, i) => {
                const selected = selectedTags.includes(label);
                const disabled = !selected && selectedTags.length >= MAX_TAGS;
                return (
                  <button
                    key={label}
                    onClick={() => !disabled && toggleTag(label)}
                    disabled={disabled}
                    className={`rounded-2xl border-2 px-5 py-5 text-left transition-all ${
                      selected
                        ? "border-transparent bg-[#04112e] text-white shadow-[0_6px_20px_rgba(4,17,46,0.2)]"
                        : disabled
                        ? "border-[#e4eaf3] bg-white text-[#c0c7d0] cursor-not-allowed"
                        : "border-[#e4eaf3] bg-white text-[#344054] hover:border-[#1167e8] hover:-translate-y-0.5"
                    }`}
                  >
                    {selected ? (
                      <div className="mb-3 flex size-6 items-center justify-center rounded-md bg-[#1167e8]">
                        <span className="text-[10px] font-[900] text-white">✓</span>
                      </div>
                    ) : (
                      <p className={`mb-3 text-[11px] font-[700] ${disabled ? "text-[#d0d5dd]" : "text-[#9ca3af]"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </p>
                    )}
                    <p className="text-[15px] font-[700] leading-tight">{label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="mt-5 text-[13px] text-[#e03131]">⚠ {error}</p>}
      </div>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[#e4eaf3] bg-white">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-6 py-4">
          <button
            onClick={() => { setStep((s) => s - 1); setError(""); }}
            disabled={step === 1}
            className="text-[14px] font-[600] text-[#667085] transition-colors hover:text-[#344054] disabled:invisible"
          >
            ← 이전
          </button>

          {step === 3 && (
            <span className="text-[14px] font-[700] text-[#344054]">
              선택 <span className="text-[#1167e8]">{selectedTags.length}</span> / {MAX_TAGS}
            </span>
          )}

          <button
            onClick={step < 3 ? next : complete}
            disabled={!canProceed || loading}
            className={`rounded-xl px-7 py-2.5 text-[15px] font-[800] transition-all ${
              canProceed
                ? "bg-[#04112e] text-white hover:bg-[#0b3fa0] hover:shadow-[0_4px_16px_rgba(4,17,46,0.2)]"
                : "bg-[#e4eaf3] text-[#9ca3af] cursor-not-allowed"
            }`}
          >
            {loading ? "저장 중..." : step < 3 ? "다음" : "시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
