import { useState } from "react";
import { login, signup } from "../../../api/auth";
import illustMain from "../../../imports/civic_group_transparent.png";
import iconInterest from "../../../imports/civic_icon_interest_transparent.png";
import iconDeadline from "../../../imports/civic_icon_deadline_transparent.png";
import iconRecord from "../../../imports/civic_icon_record_transparent.png";
import logoImg from "../../../imports/logo.png";

interface LoginPageProps {
  onSuccess: (isNewUser: boolean) => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login({ email, password });
      } else {
        await signup({ email, password });
      }
      onSuccess(tab === "signup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* ── 왼쪽 패널 — 홈 히어로와 동일한 그라디언트 ── */}
      <div className="relative hidden w-[55%] flex-col justify-between bg-[linear-gradient(135deg,#04112e_0%,#0b3fa0_55%,#1167e8_100%)] p-16 lg:flex">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none" aria-hidden>
          <span className="text-[clamp(120px,20vw,280px)] font-[900] leading-none tracking-[-0.06em] text-white/[0.03]">
            지금참여
          </span>
        </div>

        {/* 로고 */}
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="지금참여" className="size-10 rounded-xl object-contain" />
          <span className="text-[18px] font-[800] tracking-[-0.03em] text-white">지금참여</span>
        </div>

        {/* 메인 카피 */}
        <div>
          <div className="mb-5 inline-block rounded-full border border-white/20 px-3 py-1">
            <span className="text-[11px] font-[600] tracking-widest text-white/50 uppercase">Civic Platform</span>
          </div>
          <h1 className="text-[clamp(36px,4vw,56px)] font-[900] leading-[1.1] tracking-[-0.05em] text-white">
            시민의 목소리가<br />
            <span className="text-[#63b3ed]">법을 만듭니다</span>
          </h1>
          <p className="mt-5 max-w-[380px] text-[15px] leading-relaxed text-white/55">
            국회 법안, 청원, 입법예고를 한 곳에서.<br />AI가 분석하고, 당신이 참여합니다.
          </p>
          {/* 일러스트 */}
          <div className="mt-8">
            <img
              src={illustMain}
              alt="시민 참여 일러스트"
              className="w-full max-w-[420px] object-contain"
            />
          </div>

          <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
            {[
              { img: iconInterest, title: "관심 이슈를 한눈에", desc: "내가 관심 있는 정책과 청원을 모아볼 수 있어요." },
              { img: iconDeadline, title: "마감 알림을 놓치지 않게", desc: "중요한 이슈의 마감일을 알림으로 받아보세요." },
              { img: iconRecord, title: "참여 기록을 확인하세요", desc: "내가 참여한 활동과 변화를 한눈에 확인할 수 있어요." },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <img src={f.img} alt={f.title} className="size-10 shrink-0 object-contain" />
                <div>
                  <p className="text-[13px] font-[700] text-white/90">{f.title}</p>
                  <p className="text-[12px] text-white/45">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[12px] text-white/20">© 2026 지금참여. All rights reserved.</p>
      </div>

      {/* ── 오른쪽 패널 — 흰 배경, 폼 직접 배치 ── */}
      <div className="flex flex-1 flex-col justify-center bg-white px-16 xl:px-24">

        {/* 헤딩 + 탭 전환 링크 */}
        <div className="mb-10">
          <h2 className="text-[32px] font-[900] tracking-[-0.04em] text-[#111827]">
            {tab === "login" ? "로그인" : "회원가입"}
          </h2>
          <p className="mt-2 text-[15px] text-[#667085]">
            {tab === "login" ? "아직 계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
            <button
              onClick={() => { setTab(tab === "login" ? "signup" : "login"); setError(""); }}
              className="font-[700] text-[#1167e8] hover:underline"
            >
              {tab === "login" ? "회원가입하기" : "로그인하기"}
            </button>
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-[13px] font-[700] text-[#344054]">이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-b-2 border-[#e4eaf3] bg-transparent pb-3 text-[16px] text-[#111827] placeholder-[#d0d5dd] transition-colors focus:border-[#1167e8] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-[700] text-[#344054]">비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-b-2 border-[#e4eaf3] bg-transparent pb-3 text-[16px] text-[#111827] placeholder-[#d0d5dd] transition-colors focus:border-[#1167e8] focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-[13px] text-[#e03131]">⚠ {error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#1167e8] px-8 py-4 text-[16px] font-[800] text-white transition-all hover:bg-[#0b3fa0] hover:shadow-[0_8px_28px_rgba(17,103,232,0.3)] disabled:opacity-60"
          >
            <span>{loading ? "처리 중..." : tab === "login" ? "로그인" : "회원가입"}</span>
            <span className="text-[20px]">→</span>
          </button>
        </form>

        <p className="mt-8 text-[12px] text-[#9ca3af]">© 2026 지금참여. All rights reserved.</p>
      </div>
    </div>
  );
}
