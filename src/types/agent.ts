export interface AgentHeaderCard {
  title: string;
  description: string;
}

export interface SummaryCard {
  title: string;
  items: string[];
}

export interface RecommendationReasonCard {
  title: string;
  description: string;
  tags: string[];
}

export type ImpactLevel = "high" | "medium" | "low" | "unknown";
export type ImpactType = "benefit" | "risk" | "mixed" | "neutral" | "unknown";

export interface UserImpactCard {
  title: string;
  impactLevel: ImpactLevel;
  impactType: ImpactType;
  description: string;
  effects: string[];
  uncertainty: string;
}

export interface KeyDateItem {
  type: string;
  label: string;
  date: string;
  dDay: string;
}

export interface CalendarSuggestion {
  shouldSuggest: boolean;
  reason: string;
  calendarTitle: string;
  calendarDate: string;
  reminder: string;
}

export interface KeyDatesCard {
  title: string;
  dates: KeyDateItem[];
  calendarSuggestion: CalendarSuggestion;
}

export interface ActionItem {
  type: string;
  label: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface RecommendedActionsCard {
  title: string;
  actions: ActionItem[];
}

export interface MissingProfileQuestionCard {
  needInfo: boolean;
  question: string;
  options: string[];
  reason: string;
}

export interface AnalysisCards {
  agentHeader: AgentHeaderCard;
  summary: SummaryCard;
  recommendationReason: RecommendationReasonCard;
  userImpact: UserImpactCard;
  keyDates: KeyDatesCard;
  recommendedActions: RecommendedActionsCard;
  missingProfileQuestion: MissingProfileQuestionCard;
}

export interface DetailPageAnalysisResponse {
  eventId: string;
  userId: string;
  analysis: AnalysisCards;
}

export interface SimilarIssueDto {
  id: string;
  type: string;
  title: string;
  dDay: string;
  reason: string;
}

export interface OpinionDraftResponse {
  stance: string;
  draft: string;
  disclaimer: string;
}

export interface CalendarRegistrationResponse {
  registered: boolean;
  message: string;
  calendarEventId: string | null;
  calendarTitle: string | null;
  calendarDate: string | null;
}

export interface UserCalendarEvent {
  id: number;
  userId: string;
  eventId: string;
  issueType: string;
  calendarTitle: string;
  calendarDate: string;
  reminder: string;
  createdAt: string;
}

export interface ChatSource {
  id: string;
  type: string;
  title: string;
  dDay: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

// 챗봇 자율 에이전트(SSE)가 사용 중인 도구 한 단계
export interface ChatToolStep {
  name: string;            // BE tool 이름 (search_issues 등)
  input?: string;
  status: "running" | "done";
  observation?: string;
}
