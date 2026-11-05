'use client';
import { KeyboardEvent } from 'react';

export type CalItem = {
  id: number;
  reserved_date: string;
  start_time: string;
  end_time: string;
  meeting_room_id: number;
  room_name: string;
  status: string;
  mine: boolean;
};

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n: number) => String(n).padStart(2, '0');
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const t = y * 12 + (m - 1) + delta;
  return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`;
}

/** 예약 가능한 시간(08:00~22:00, 30분 단위 28칸)이 모두 예약된 날짜 목록 */
function fullDays(items: CalItem[]): Set<string> {
  const covered: Record<string, Set<number>> = {};
  for (const it of items) {
    const set = (covered[it.reserved_date] ||= new Set());
    for (let m = toMin(it.start_time); m < toMin(it.end_time); m += 30) set.add(m);
  }
  const full = new Set<string>();
  for (const [date, set] of Object.entries(covered)) {
    let all = true;
    for (let m = 8 * 60; m < 22 * 60; m += 30) if (!set.has(m)) { all = false; break; }
    if (all) full.add(date);
  }
  return full;
}

/**
 * 한 달 달력. 날짜 칸에는 숫자만 보여 준다.
 * - 고른 회의실이 하루 종일 예약된 날, 지난 날짜는 회색으로 채우고 고를 수 없게 한다.
 * - 내가 예약한 날(어느 회의실이든)은 파란 점으로 표시한다.
 */
export function Calendar({
  month,
  onMonth,
  selected,
  onSelect,
  roomItems,
  mineDates,
  today,
}: {
  month: string;
  onMonth: (m: string) => void;
  selected: string;
  onSelect: (d: string) => void;
  roomItems: CalItem[];
  mineDates: Set<string>;
  today: string;
}) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const full = fullDays(roomItems);

  const key = (e: KeyboardEvent, date: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(date);
    }
  };

  return (
    <div className="cal">
      <div className="cal-head">
        <strong>{y}년 {m}월</strong>
        <div className="cal-nav">
          <button type="button" className="sub small-btn" onClick={() => onMonth(shiftMonth(month, -1))} aria-label="이전 달">이전</button>
          <button type="button" className="sub small-btn" onClick={() => onMonth(today.slice(0, 7))}>오늘</button>
          <button type="button" className="sub small-btn" onClick={() => onMonth(shiftMonth(month, 1))} aria-label="다음 달">다음</button>
        </div>
      </div>
      <div className="cal-grid">
        {DOW.map((d, i) => (
          <div key={d} className={`cal-dow${i === 0 ? ' sun' : ''}`}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="cal-cell out" />;
          const date = `${month}-${pad(d)}`;
          const past = date < today;
          const isFull = full.has(date);
          const disabled = past || isFull;
          const cls = ['cal-cell'];
          if (past) cls.push('past');
          if (isFull) cls.push('full');
          if (date === today) cls.push('today');
          if (date === selected && !disabled) cls.push('sel');
          const mine = mineDates.has(date);
          const label = `${m}월 ${d}일${past ? ', 지난 날짜' : isFull ? ', 예약이 가득 찼어요' : ''}${mine ? ', 내 예약 있음' : ''}`;
          return (
            <div
              key={i}
              className={cls.join(' ')}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={label}
              aria-disabled={disabled}
              aria-pressed={date === selected}
              title={isFull ? '이 날은 이 회의실의 예약이 가득 찼어요' : undefined}
              onClick={() => { if (!disabled) onSelect(date); }}
              onKeyDown={(e) => { if (!disabled) key(e, date); }}
            >
              <span className="cal-date">{d}</span>
              {isFull && <span className="cal-full">마감</span>}
              {mine && <i className="cal-dot" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span><i className="l-dot" />내 예약이 있는 날</span>
        <span><i className="l-full" />마감 (예약이 가득 참)</span>
        <span>선택한 날짜로 아래 시간표와 예약 날짜가 바뀌어요</span>
      </div>
    </div>
  );
}
