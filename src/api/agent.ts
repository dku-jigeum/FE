import { api } from "./client";

export type {
  AgentHeaderCard, SummaryCard, RecommendationReasonCard,
  ImpactLevel, ImpactType, UserImpactCard,
  KeyDateItem, CalendarSuggestion, KeyDatesCard,
  ActionItem, RecommendedActionsCard, MissingProfileQuestionCard,
  AnalysisCards, DetailPageAnalysisResponse,
  SimilarIssueDto, OpinionDraftResponse, CalendarRegistrationResponse,
  UserCalendarEvent, ChatSource, ChatResponse, ChatTurn,
} from "../types/agent";

export async function analyzeIssue(
  issueId: string,
  issueType: string,
  recommendationInput?: {
    similarityScore?: number;
    matchedKeywords?: string[];
    matchedCategories?: string[];
  }
): Promise<import("../types/agent").DetailPageAnalysisResponse> {
  return api.post("/api/agent/analyze", { issueId, issueType, ...recommendationInput });
}

export async function getSimilarEvents(
  eventId: string,
  issueType: string
): Promise<import("../types/agent").SimilarIssueDto[]> {
  return api.get(`/api/events/${eventId}/similar?issueType=${issueType}`);
}

export async function getOpinionDraft(
  eventId: string,
  issueType: string,
  stance: string
): Promise<import("../types/agent").OpinionDraftResponse> {
  return api.post(`/api/events/${eventId}/opinion-draft`, { issueType, stance });
}

export async function registerCalendarEvent(
  eventId: string,
  issueType: string,
  calendarTitle?: string,
  calendarDate?: string,
  reminder?: string
): Promise<import("../types/agent").CalendarRegistrationResponse> {
  return api.post(`/api/events/${eventId}/calendar`, {
    issueType, calendarTitle, calendarDate, reminder,
  });
}

export async function getMyCalendar(): Promise<import("../types/agent").UserCalendarEvent[]> {
  return api.get("/api/events/calendar");
}

/**
 * 챗봇 Q&A (KAN-41). 상세페이지에서 질문 시 issueId/issueType을 함께 전달하면
 * 해당 이슈가 답변 컨텍스트에 포함된다.
 */
export async function chatWithAgent(
  question: string,
  issueId?: string,
  issueType?: string,
  history?: import("../types/agent").ChatTurn[]
): Promise<import("../types/agent").ChatResponse> {
  return api.post("/api/agent/chat", { question, issueId, issueType, history });
}
