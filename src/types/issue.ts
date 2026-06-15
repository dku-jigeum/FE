export type IssueType = "청원" | "입법예고" | "법안";
export type IssueStatus = "진행중" | "마감임박" | "검토중" | "완료";

export interface Issue {
  id: string;
  type: IssueType;
  title: string;
  summary: string;
  category: string;
  status: IssueStatus;
  deadline: string;      // "YYYY.MM.DD"
  dday: string;          // "D-N" | "D-Day" | "마감"
  dnum: number;
  participants: number;
  goal: number;
  tags: string[];
  aiRecommended: boolean;
  billNumber: string;
  proposalDate: string;
  proposer: string;
  linkUrl?: string;
}

// BE FeedItem → FE Issue 변환
export interface BeFeedItem {
  id: string;
  type: string;          // "bill" | "petition" | "legislation"
  title: string;
  content: string | null;
  linkUrl: string | null;
  deadline: string | null;
  participantCount: number | null;
  viewCount: number | null;
  source: string;        // "personalized" | "trending"
}

// BE BillSummary → FE Issue 변환
export interface BeBillSummary {
  billNo: string;
  title: string;
  committee: string | null;
  deadline: string | null;
  viewCount: number;
  linkUrl: string | null;
}

// BE PetitionSummary
export interface BePetitionSummary {
  petitionNo: string;
  title: string;
  participantCount: number;
  deadline: string | null;
  url: string;
}

// BE LegislationSummary
export interface BeLegislationSummary {
  billId: string;
  billNo: string;
  title: string;
  deadline: string | null;
}

const TYPE_MAP: Record<string, IssueType> = {
  bill: "법안",
  petition: "청원",
  legislation: "입법예고",
};

export function calcDday(deadlineIso: string | null): { dday: string; dnum: number; status: IssueStatus } {
  if (!deadlineIso) return { dday: "상시", dnum: 999, status: "진행중" };

  const deadline = new Date(deadlineIso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return { dday: "마감", dnum: 0, status: "완료" };
  if (diff === 0) return { dday: "D-Day", dnum: 0, status: "마감임박" };
  if (diff <= 7) return { dday: `D-${diff}`, dnum: diff, status: "마감임박" };
  return { dday: `D-${diff}`, dnum: diff, status: "진행중" };
}

export function formatDeadline(iso: string | null): string {
  if (!iso) return "";
  return iso.replace(/-/g, ".");
}

export function feedItemToIssue(item: BeFeedItem): Issue {
  const { dday, dnum, status } = calcDday(item.deadline);
  return {
    id: item.id,
    type: TYPE_MAP[item.type] ?? "법안",
    title: item.title,
    summary: item.content ?? item.title,
    category: "",
    status,
    deadline: formatDeadline(item.deadline),
    dday,
    dnum,
    participants: item.participantCount ?? item.viewCount ?? 0,
    goal: 50000,
    tags: [],
    aiRecommended: item.source === "personalized",
    billNumber: item.id,
    proposalDate: "",
    proposer: "",
    linkUrl: item.linkUrl ?? undefined,
  };
}

export function billToIssue(b: BeBillSummary): Issue {
  const { dday, dnum, status } = calcDday(b.deadline);
  return {
    id: b.billNo,
    type: "법안",
    title: b.title,
    summary: b.title,
    category: b.committee ?? "",
    status,
    deadline: formatDeadline(b.deadline),
    dday,
    dnum,
    participants: b.viewCount,
    goal: 0,
    tags: [],
    aiRecommended: false,
    billNumber: b.billNo,
    proposalDate: "",
    proposer: b.committee ?? "",
    linkUrl: b.linkUrl ?? undefined,
  };
}

export function petitionToIssue(p: BePetitionSummary): Issue {
  const { dday, dnum, status } = calcDday(p.deadline);
  return {
    id: p.petitionNo,
    type: "청원",
    title: p.title,
    summary: p.title,
    category: "",
    status,
    deadline: formatDeadline(p.deadline),
    dday,
    dnum,
    participants: p.participantCount,
    goal: 100000,
    tags: [],
    aiRecommended: false,
    billNumber: p.petitionNo,
    proposalDate: "",
    proposer: "시민청원",
    linkUrl: p.url,
  };
}

export function legislationToIssue(l: BeLegislationSummary): Issue {
  const { dday, dnum, status } = calcDday(l.deadline);
  return {
    id: l.billId,
    type: "입법예고",
    title: l.title,
    summary: l.title,
    category: "",
    status,
    deadline: formatDeadline(l.deadline),
    dday,
    dnum,
    participants: 0,
    goal: 0,
    tags: [],
    aiRecommended: false,
    billNumber: l.billNo,
    proposalDate: "",
    proposer: "",
  };
}
