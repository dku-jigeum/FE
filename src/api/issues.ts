import { api } from "./client";
import {
  BeBillSummary, BeLegislationSummary, BePetitionSummary, BeFeedItem,
  Issue, billToIssue, petitionToIssue, legislationToIssue, feedItemToIssue,
} from "../types/issue";

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

export async function getFeed(limit = 20): Promise<Issue[]> {
  const items = await api.get<BeFeedItem[]>(`/api/feed?limit=${limit}`);
  return items.map(feedItemToIssue);
}

// 홈 트렌딩 섹션 — 로그인 불필요한 조회수·참여수 기반 트렌딩 Top-N
export async function getTrending(limit = 9): Promise<Issue[]> {
  const items = await api.get<BeFeedItem[]>(`/api/feed/trending?limit=${limit}`);
  return items.map(feedItemToIssue);
}

export async function getBills(page = 0, size = 20): Promise<Issue[]> {
  const res = await api.get<Page<BeBillSummary>>(`/api/bills?page=${page}&size=${size}`);
  return res.content.map(billToIssue);
}

export async function getPetitions(page = 0, size = 20): Promise<Issue[]> {
  const res = await api.get<Page<BePetitionSummary>>(`/api/petitions?page=${page}&size=${size}`);
  return res.content.map(petitionToIssue);
}

export async function getLegislations(page = 0, size = 20): Promise<Issue[]> {
  const res = await api.get<Page<BeLegislationSummary>>(`/api/legislation?page=${page}&size=${size}`);
  return res.content.map(legislationToIssue);
}

export async function getAllIssues(): Promise<Issue[]> {
  const results = await Promise.allSettled([getBills(), getPetitions(), getLegislations()]);
  const issues = results
    .filter((r): r is PromiseFulfilledResult<Issue[]> => r.status === "fulfilled")
    .flatMap(r => r.value);
  if (issues.length === 0) throw new Error("이슈 데이터를 불러올 수 없습니다.");
  return issues;
}
