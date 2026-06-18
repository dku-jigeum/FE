# 지금참여 — Frontend

> AI 기반 정치 참여 플랫폼 **지금참여**의 웹 프론트엔드. 개인화 피드·이슈 상세 AI 분석·실시간 챗봇 UI를 제공합니다.

단국대학교 오픈소스 기초 프로젝트 (5조) · [조직 홈](https://github.com/dku-jigeum) · [문서(Confluence)](https://dankook-opensource-project.atlassian.net/wiki/spaces/MFS/overview)

## 기술 스택

- **React + TypeScript + Vite**
- **UI**: Tailwind CSS · shadcn/ui (Radix UI) · MUI
- **데이터**: 공용 API client + 커스텀 훅 (`useIssues` · `useTrending` · `useChat` 등)
- **실시간**: SSE 스트리밍(`agentStream`)으로 에이전트 도구 사용 과정을 실시간 표시

## 주요 화면

- 로그인 · 인증 (JWT)
- 온보딩 (관심사·직업 입력)
- 홈 · 이슈 피드 (개인화 추천 + 트렌딩)
- 이슈 상세 + AI 분석 카드
- AI 챗봇 위젯 (자율 ReAct · 실시간 스트리밍)
- 캘린더 (이슈 마감일)
- 북마크 · 마이페이지

## 로컬 실행

### 요구사항
- Node.js 18+

### 1) 설치
```bash
npm install
```

### 2) 환경 변수
`.env.example` 를 복사해 `.env.local` 을 만들고 백엔드 주소를 설정합니다.
```
VITE_API_BASE_URL=http://localhost:8082
```
> ⚠️ 백엔드(BE)는 기본 포트 **8082** 로 실행됩니다. (예시 파일의 기본값은 8080이니 BE 포트에 맞춰 수정하세요.)

### 3) 실행
```bash
npm run dev     # Vite 개발 서버 (기본 http://localhost:5173)
npm run build   # 프로덕션 빌드
npm run lint    # 타입 체크 (tsc --noEmit)
```
> 데이터가 표시되려면 백엔드(BE)를 먼저 실행해야 합니다.

## 브랜치 전략

- **`main`** 이 base. 작업 브랜치 `feature/KAN-번호-기능명`, PR 제목 `[KAN-번호] [FE] 작업 내용`.

## 관련 링크

- [BE 저장소](https://github.com/dku-jigeum/BE) · [Jira KAN 보드](https://dankook-opensource-project.atlassian.net/jira/software/projects/KAN/boards/1) · [Confluence 문서](https://dankook-opensource-project.atlassian.net/wiki/spaces/MFS/overview)
