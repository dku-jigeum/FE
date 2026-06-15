import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import {
  addDays,
  addMonths,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { getMyCalendar } from "../../../api/agent";
import type { UserCalendarEvent } from "../../../types/agent";

const ISSUE_TYPE_LABEL: Record<string, string> = {
  bill: "법안",
  petition: "청원",
  legislation: "입법예고",
};

const ISSUE_TYPE_COLOR: Record<string, string> = {
  bill: "bg-[#e8f0fe] text-[#1a56db]",
  petition: "bg-[#fef3c7] text-[#92400e]",
  legislation: "bg-[#d1fae5] text-[#065f46]",
};

// 월 그리드 셀 안에 들어가는 이벤트 칩 색상 (막대 / 배경 / 글자)
const CHIP_STYLE: Record<string, { bar: string; bg: string; text: string }> = {
  bill: { bar: "bg-[#1167e8]", bg: "bg-[#eaf2ff]", text: "text-[#1a56db]" },
  petition: { bar: "bg-[#d97706]", bg: "bg-[#fef3c7]", text: "text-[#92400e]" },
  legislation: { bar: "bg-[#059669]", bg: "bg-[#d1fae5]", text: "text-[#065f46]" },
};
const CHIP_DEFAULT = { bar: "bg-[#6b7280]", bg: "bg-[#f3f4f6]", text: "text-[#374151]" };

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** Date → 'YYYY-MM-DD' (로컬). calendarDate(slice 0,10)와 키를 맞춘다. */
function fmtKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eventDayKey(e: UserCalendarEvent): string {
  return e.calendarDate.slice(0, 10);
}

function calcDDay(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "마감";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
}

function EventChip({ event }: { event: UserCalendarEvent }) {
  const c = CHIP_STYLE[event.issueType] ?? CHIP_DEFAULT;
  return (
    <div className={`flex w-full items-center gap-1 rounded-[3px] ${c.bg} px-1 py-[1px]`}>
      <span className={`h-2.5 w-[3px] shrink-0 rounded-full ${c.bar}`} />
      <span className={`min-w-0 flex-1 truncate text-[10px] font-[500] leading-tight ${c.text}`}>
        {event.calendarTitle}
      </span>
    </div>
  );
}

function CalendarCard({ event, onEventClick }: {
  event: UserCalendarEvent;
  onEventClick: (eventId: string, issueType: string) => void;
}) {
  const dday = calcDDay(event.calendarDate);
  const isExpired = dday === "마감";
  const isUrgent = !isExpired && dday !== "D-Day" && parseInt(dday.replace("D-", "")) <= 7;
  const typeBadge = ISSUE_TYPE_COLOR[event.issueType] ?? "bg-[#f3f4f6] text-[#374151]";

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${isExpired ? "opacity-50" : ""}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-[600] ${typeBadge}`}>
          {ISSUE_TYPE_LABEL[event.issueType] ?? event.issueType}
        </span>
        <span className={`shrink-0 text-[13px] font-[700] ${isExpired ? "text-[#9ca3af]" : isUrgent ? "text-[#dc2626]" : "text-[#1167e8]"}`}>
          {dday}
        </span>
      </div>
      <p className="mb-3 text-[15px] font-[600] leading-snug text-[#111827]">
        {event.calendarTitle}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[13px] text-[#6b7280]">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {event.calendarDate}
          </span>
          {event.reminder && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {event.reminder}
            </span>
          )}
        </div>
        {!isExpired && (
          <button
            onClick={() => onEventClick(event.eventId, event.issueType)}
            className="text-[13px] font-[500] text-[#1167e8] hover:underline"
          >
            이슈 보기
          </button>
        )}
      </div>
    </div>
  );
}

type CalView = "month" | "agenda";

export function CalendarPage({ onBack, onOpenIssue }: {
  onBack: () => void;
  onOpenIssue: (id: string) => void;
}) {
  const [events, setEvents] = useState<UserCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<CalView>("month");
  const [monthCursor, setMonthCursor] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    getMyCalendar()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(a.calendarDate).getTime() - new Date(b.calendarDate).getTime()
        );
        setEvents(sorted);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // 날짜별 일정 묶음 — 셀 칩 + 날짜 선택 필터에 사용
  const eventsByDay = useMemo(() => {
    const map = new Map<string, UserCalendarEvent[]>();
    for (const e of events) {
      const key = eventDayKey(e);
      const list = map.get(key);
      if (list) list.push(e);
      else map.set(key, [e]);
    }
    return map;
  }, [events]);

  // 표시 중인 달의 6주(42칸) 그리드
  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 0 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [monthCursor]);

  const upcoming = events.filter((e) => calcDDay(e.calendarDate) !== "마감");
  const expired = events.filter((e) => calcDDay(e.calendarDate) === "마감");

  const selectedKey = selectedDate ? fmtKey(selectedDate) : null;
  const selectedEvents = selectedKey ? eventsByDay.get(selectedKey) ?? [] : null;

  const selectDay = (day: Date, inMonth: boolean) => {
    if (!inMonth) setMonthCursor(startOfMonth(day));
    setSelectedDate((prev) => (prev && isSameDay(prev, day) ? undefined : day));
  };
  const goToday = () => {
    const t = new Date();
    setMonthCursor(startOfMonth(t));
    setSelectedDate(t);
  };

  return (
    <div className="mx-auto max-w-[680px] px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[14px] text-[#6b7280] hover:text-[#111827] transition-colors"
        >
          <ChevronLeft className="size-4" />
          돌아가기
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#eaf2ff]">
            <CalendarDays className="size-5 text-[#1167e8]" />
          </div>
          <div>
            <h1 className="text-[20px] font-[700] text-[#111827]">내 캘린더</h1>
            <p className="text-[13px] text-[#6b7280]">등록한 마감일 일정 {events.length}개</p>
          </div>
        </div>
        {/* 월 / 일정 뷰 토글 */}
        <div className="inline-flex shrink-0 rounded-lg border border-[#e4eaf3] bg-white p-0.5 text-[13px] font-[600]">
          {(["month", "agenda"] as CalView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 transition-colors ${
                view === v ? "bg-[#1167e8] text-white" : "text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              {v === "month" ? "월" : "일정"}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-[14px] text-[#6b7280]">
          불러오는 중...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-[#fee2e2] bg-[#fff5f5] px-5 py-8 text-center text-[14px] text-[#dc2626]">
          일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-2xl border border-[#e4eaf3] bg-white px-5 py-16 text-center">
          <CalendarDays className="mx-auto mb-3 size-10 text-[#d1d5db]" />
          <p className="text-[15px] font-[600] text-[#374151]">등록된 일정이 없어요</p>
          <p className="mt-1 text-[13px] text-[#9ca3af]">이슈 분석 후 마감일을 캘린더에 담아보세요.</p>
        </div>
      )}

      {/* ── 월 뷰 ── */}
      {!loading && !error && events.length > 0 && view === "month" && (
        <>
          <div className="mb-6 overflow-hidden rounded-2xl border border-[#e4eaf3] bg-white shadow-sm">
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-[700] text-[#111827]">
                  {monthCursor.getFullYear()}년 {monthCursor.getMonth() + 1}월
                </span>
                <button
                  onClick={goToday}
                  className="ml-1 rounded-md border border-[#e4eaf3] px-2 py-0.5 text-[12px] font-[500] text-[#6b7280] hover:bg-[#f8fafc] hover:text-[#111827] transition-colors"
                >
                  오늘
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMonthCursor((m) => addMonths(m, -1))}
                  className="flex size-7 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f1f5f9] transition-colors"
                  aria-label="이전 달"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => setMonthCursor((m) => addMonths(m, 1))}
                  className="flex size-7 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f1f5f9] transition-colors"
                  aria-label="다음 달"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-y border-[#f1f5f9] bg-[#fbfcfe]">
              {WEEKDAYS.map((w, i) => (
                <div
                  key={w}
                  className={`py-1.5 text-center text-[11px] font-[600] ${
                    i === 0 ? "text-[#dc2626]" : i === 6 ? "text-[#1167e8]" : "text-[#9ca3af]"
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* 날짜 셀 */}
            <div className="grid grid-cols-7">
              {gridDays.map((day, idx) => {
                const inMonth = isSameMonth(day, monthCursor);
                const dayEvents = eventsByDay.get(fmtKey(day)) ?? [];
                const today = isToday(day);
                const isSel = selectedDate ? isSameDay(selectedDate, day) : false;
                const dow = idx % 7;
                return (
                  <button
                    key={idx}
                    onClick={() => selectDay(day, inMonth)}
                    className={`flex min-h-[84px] flex-col gap-0.5 border-b border-r border-[#f1f5f9] p-1 text-left align-top transition-colors hover:bg-[#f8fafc] ${
                      !inMonth ? "bg-[#fafbfc]" : ""
                    } ${isSel ? "bg-[#f5f9ff] ring-2 ring-inset ring-[#1167e8]" : ""}`}
                  >
                    <span
                      className={`flex size-5 items-center justify-center rounded-full text-[12px] ${
                        today
                          ? "bg-[#1167e8] font-[700] text-white"
                          : !inMonth
                            ? "text-[#c4cad3]"
                            : dow === 0
                              ? "text-[#dc2626]"
                              : dow === 6
                                ? "text-[#1167e8]"
                                : "text-[#374151]"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <div className="flex w-full flex-col gap-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((e) => (
                        <EventChip key={e.id} event={e} />
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="px-1 text-[10px] font-[500] text-[#9ca3af]">
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 범례 */}
            <div className="flex items-center justify-center gap-4 border-t border-[#f1f5f9] px-3 py-2.5 text-[12px] text-[#6b7280]">
              {(["bill", "petition", "legislation"] as const).map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${CHIP_STYLE[t].bar}`} />
                  {ISSUE_TYPE_LABEL[t]}
                </span>
              ))}
            </div>
          </div>

          {/* 선택한 날짜 일정 (월 뷰 하단) */}
          {selectedEvents !== null ? (
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-[700] text-[#111827]">
                  {selectedDate!.getMonth() + 1}월 {selectedDate!.getDate()}일 일정 · {selectedEvents.length}개
                </h2>
                <button
                  onClick={() => setSelectedDate(undefined)}
                  className="flex items-center gap-1 text-[13px] text-[#6b7280] hover:text-[#111827] transition-colors"
                >
                  <X className="size-3.5" />
                  닫기
                </button>
              </div>
              {selectedEvents.length === 0 ? (
                <div className="rounded-2xl border border-[#e4eaf3] bg-white px-5 py-10 text-center text-[14px] text-[#9ca3af]">
                  이 날은 등록된 일정이 없어요.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((e) => (
                    <CalendarCard key={e.id} event={e} onEventClick={onOpenIssue} />
                  ))}
                </div>
              )}
            </section>
          ) : (
            upcoming.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-[13px] font-[700] uppercase tracking-wider text-[#9ca3af]">다가오는 일정</h2>
                <div className="space-y-3">
                  {upcoming.slice(0, 3).map((e) => (
                    <CalendarCard key={e.id} event={e} onEventClick={onOpenIssue} />
                  ))}
                </div>
                {upcoming.length > 3 && (
                  <button
                    onClick={() => setView("agenda")}
                    className="mt-3 w-full rounded-xl border border-[#e4eaf3] bg-white py-2.5 text-[13px] font-[500] text-[#1167e8] hover:bg-[#f8fafc] transition-colors"
                  >
                    전체 일정 보기 ({events.length})
                  </button>
                )}
              </section>
            )
          )}
        </>
      )}

      {/* ── 일정(Agenda) 뷰 ── */}
      {!loading && !error && events.length > 0 && view === "agenda" && (
        <>
          {upcoming.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-[13px] font-[700] uppercase tracking-wider text-[#9ca3af]">예정된 일정</h2>
              <div className="space-y-3">
                {upcoming.map((e) => (
                  <CalendarCard key={e.id} event={e} onEventClick={onOpenIssue} />
                ))}
              </div>
            </section>
          )}

          {expired.length > 0 && (
            <section>
              <h2 className="mb-3 text-[13px] font-[700] uppercase tracking-wider text-[#9ca3af]">마감된 일정</h2>
              <div className="space-y-3">
                {expired.map((e) => (
                  <CalendarCard key={e.id} event={e} onEventClick={onOpenIssue} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
