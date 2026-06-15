---
level: 2
mode: committed
status: active
last_verified: 2026-06-02
confidence: 0.9
owners: [박세현]
description: FE 고유 규칙 — 공통 원칙·docs는 루트 CLAUDE.md 참조.
---

# CLAUDE.md — jigeumchamyeo-frontend (FE)

> **공통 원칙·워크플로우·설계 문서는 루트를 읽어라:**
> - 원칙: `../CLAUDE.md`
> - 문서: `../docs/` (WORKFLOW, ARCHITECTURE, DOMAIN_DESIGN, CHANGELOG, TODO)
> - 에이전트·훅: `../.claude/`

---

## 1. Key Rules (FE 고유)

- API 호출은 `src/api/` 에서만 — 컴포넌트 직접 fetch 금지
- 환경변수는 `VITE_` 접두사, `.env.local` 보관 (git 제외)
- 타입은 `src/types/` (신규 타입은 반드시 분리)
- mock 데이터는 `src/mocks/` (컴포넌트 하드코딩 금지)
- 공통 UI는 `src/app/components/ui/` (shadcn/ui 기반)
- 신규 페이지는 `src/app/pages/` 로 분리 (App.tsx 인라인 금지)
- Tailwind 클래스 우선, 인라인 style은 동적 값에만
- react-router v7 — v6 문법(`<Switch>`) 사용 금지

## 2. Gotchas

- `figma:asset/` import는 `vite.config.ts`의 `figmaAssetResolver` 플러그인 의존
- `pnpm-workspace.yaml` 있으나 단일 패키지 — `npm i` 가능
- shadcn/ui 추가: `npx shadcn add <component>` → `src/app/components/ui/` 생성
- BE API 연동: `VITE_API_BASE_URL` 설정 필수

## 3. 빌드 · 검증

```bash
npm run build   # TypeScript 컴파일 + Vite 번들
npm run dev     # 개발 서버
npm run lint    # ESLint
```

## 4. GitHub 워크플로우

**저장소**: https://github.com/DKU-OpenSource/FE  
**브랜치명**: `feature/{짧은-설명}`  
**커밋**: `[FE] 변경 내용 한 줄 요약`
