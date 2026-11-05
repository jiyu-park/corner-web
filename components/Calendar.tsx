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

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const t = y * 12 + (m - 1) + delta;
  return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`;
}

/** 한 달 달력. 고른 회의실의 예약을 날짜 칸에 보여 주고, 날짜를 누르면 onSelect로 알려 준다. */
export function Calendar({
  month,
  onMonth,
  selected,
  onSelect,
  items,
  today,
}: {
  month: string;
  onMonth: (m: string) => void;
  selected: string;
  onSelect: (d: string) => void;
  items: CalItem[];
  today: string;
}) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const byDay: Record<string, CalItem[]> = {};
  for (const it of items) (byDay[it.reserved_date] ||= []).push(it);

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
          const list = byDay[date] || [];
          const cls = ['cal-cell'];
          if (date < today) cls.push('past');
          if (date === today) cls.push('today');
          if (date === selected) cls.push('sel');
          const mineCount = list.filter((x) => x.mine).length;
          return (
            <div
              key={i}
              className={cls.join(' ')}
              role="button"
              tabIndex={0}
              aria-label={`${m}월 ${d}일, 예약 ${list.length}건${mineCount ? `, 내 예약 ${mineCount}건` : ''}`}
              aria-pressed={date === selected}
              onClick={() => onSelect(date)}
              onKeyDown={(e) => key(e, date)}
            >
              <span className="cal-date">{d}</span>
              {list.slice(0, 3).map((it) => (
                <span key={it.id} className={`cal-chip${it.mine ? ' mine' : ''}`}>{it.start_time}</span>
              ))}
              {list.length > 3 && <span className="cal-more">+{list.length - 3}</span>}
              {list.length > 0 && <span className={`cal-count${mineCount ? ' mine' : ''}`}>{list.length}</span>}
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span><i className="l-mine" />내 예약</span>
        <span><i className="l-busy" />다른 예약</span>
        <span>날짜를 누르면 아래 시간표와 예약 날짜가 바뀌어요</span>
      </div>
    </div>
  );
}
