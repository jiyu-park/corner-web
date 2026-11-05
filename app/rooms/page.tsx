'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { ErrorBox, OkBox } from '@/components/ErrorBox';
import { Calendar, CalItem, fullDays } from '@/components/Calendar';
import { api, fmtMin } from '@/lib/api';

const TIMES: string[] = [];
for (let m = 8 * 60; m <= 22 * 60; m += 30) TIMES.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`);
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const weekday = (date: string) => (date ? WEEKDAY[new Date(`${date}T00:00:00`).getDay()] : '');

export default function Page() {
  return <Shell><Rooms /></Shell>;
}

function Rooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomId, setRoomId] = useState<number | ''>('');
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(today().slice(0, 7));
  const [cal, setCal] = useState<CalItem[]>([]);
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('11:00');
  const [people, setPeople] = useState('2');
  const [free, setFree] = useState(false);
  const [day, setDay] = useState<any[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api('/meeting-rooms').then((r) => { setRooms(r); if (r[0]) setRoomId(r[0].id); }).catch(setError);
  }, []);

  const loadDay = useCallback(async () => {
    if (!roomId || !date) { setDay([]); return; }
    try {
      const r = await api(`/meeting-rooms/${roomId}/day?date=${date}`);
      setDay(r.reservations);
    } catch (e) { setError(e); }
  }, [roomId, date]);
  useEffect(() => { loadDay(); }, [loadDay]);

  const loadCal = useCallback(async () => {
    try {
      const r = await api(`/reservations/calendar?month=${month}`);
      setCal(r.reservations);
    } catch (e) { setError(e); }
  }, [month]);
  useEffect(() => { loadCal(); }, [loadCal]);

  // 예약 전 미리 보기: 입력이 바뀔 때마다 (잠깐 기다렸다가) 서버에 차감 계산을 물어본다. 저장하지 않는다.
  useEffect(() => {
    if (!date || !start || !end) { setPreview(null); return; }
    const t = setTimeout(async () => {
      try {
        setPreview(await api('/reservations/preview', {
          method: 'POST',
          body: { reserved_date: date, start_time: start, end_time: end, meeting_room_id: roomId === '' ? undefined : roomId, people_count: people === '' ? undefined : Number(people) },
        }));
      } catch { setPreview(null); }
    }, 300);
    return () => clearTimeout(t);
  }, [date, start, end, roomId, people, result]);

  // 방이나 달을 바꾸면 달력 아래 안내 문구는 지운다.
  useEffect(() => { setNotice(null); }, [roomId, month]);

  // 회색(마감·지난 날짜) 칸을 눌렀을 때 이유를 한 줄로 알려 준다.
  function onBlocked(d: string, kind: 'past' | 'full') {
    const [, mm, dd] = d.split('-').map(Number);
    const label = `${mm}월 ${dd}일`;
    if (kind === 'past') { setNotice(`${label}은 이미 지난 날짜라 예약할 수 없어요.`); return; }
    const othersOpen = rooms.some((r) => r.id !== roomId && !fullDays(cal.filter((c) => c.meeting_room_id === r.id)).has(d));
    setNotice(othersOpen
      ? `${label}은 ${room?.name ?? '이 회의실'}의 예약이 가득 찼어요. 다른 방을 골라 보세요.`
      : `${label}은 모든 회의실의 예약이 가득 찼어요. 다른 날짜를 골라 주세요.`);
  }

  function pickDate(d: string) {
    setNotice(null);
    setDate(d);
    setMonth(d.slice(0, 7));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await api('/reservations', {
        method: 'POST',
        body: { meeting_room_id: roomId === '' ? undefined : roomId, reserved_date: date, start_time: start, end_time: end, people_count: people === '' ? undefined : Number(people) },
      });
      setResult(r);
      await Promise.all([loadDay(), loadCal()]);
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  const slots = Array.from({ length: 28 }, (_, i) => {
    const s = 8 * 60 + i * 30;
    return day.some((r) => toMin(r.start_time) < s + 30 && toMin(r.end_time) > s);
  });
  const room = rooms.find((r) => r.id === roomId);
  const roomCal = cal.filter((c) => c.meeting_room_id === roomId);
  const mineDates = new Set(cal.filter((c) => c.mine).map((c) => c.reserved_date));
  const over = preview?.ok && preview.has_membership && preview.overage_minutes > 0;

  return (
    <>
      <h1>회의실 예약</h1>

      <h2>1. 회의실 고르기</h2>
      <div className="room-cards">
        {rooms.map((r) => (
          <div
            key={r.id}
            className={`room-card${r.id === roomId ? ' sel' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={r.id === roomId}
            onClick={() => setRoomId(r.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRoomId(r.id); } }}
          >
            <strong>{r.name}</strong>
            <span className="small">정원 {r.max_people}명 · 화상장비 {r.has_video ? '있음' : '없음'}</span>
          </div>
        ))}
      </div>

      <h2>2. 날짜 고르기 <span className="small">({room?.name ?? '회의실'}의 예약)</span></h2>
      <div className="card">
        <Calendar month={month} onMonth={setMonth} selected={date} onSelect={pickDate} roomItems={roomCal} mineDates={mineDates} onBlocked={onBlocked} today={today()} />
        {notice && <p className="cal-note" role="status">{notice}</p>}
      </div>

      <h2>{date} ({weekday(date)}) {room?.name} 시간표</h2>
      <div className="card">
        <div className="timeline">{slots.map((b, i) => <div key={i} className={b ? 'busy' : 'free'} />)}</div>
        <div className="ticks">{['08', '10', '12', '14', '16', '18', '20'].map((h) => <span key={h}>{h}:00</span>)}</div>
        <div className="legend"><span><i className="l-busy" />예약됨</span><span><i className="l-free" />비어 있음</span></div>
        {day.length === 0 ? <p className="small">이 날은 예약이 없어요.</p> : (
          <ul className="day-list">{day.map((r) => <li key={r.id}>{r.start_time}~{r.end_time} ({fmtMin(toMin(r.end_time) - toMin(r.start_time))}) · {r.status === 'reserved' ? '예약됨' : r.status === 'completed' ? '사용 완료' : r.status === 'no_show' ? '노쇼' : r.status}</li>)}</ul>
        )}
      </div>

      <h2>3. 시간과 인원 정하기</h2>
      <form className="card" onSubmit={submit}>
        <div className="row">
          <label>회의실
            <select value={roomId} onChange={(e) => setRoomId(Number(e.target.value))}>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label>날짜<input type="date" value={date} onChange={(e) => { if (e.target.value) pickDate(e.target.value); else setDate(''); }} /></label>
          <label>시작
            {free ? <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              : <select value={start} onChange={(e) => setStart(e.target.value)}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select>}
          </label>
          <label>끝
            {free ? <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              : <select value={end} onChange={(e) => setEnd(e.target.value)}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select>}
          </label>
          <label className="people">참석 인원<input type="number" value={people} onChange={(e) => setPeople(e.target.value)} /></label>
          <button disabled={busy}>예약</button>
        </div>
        <label className="check">
          <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> 개발자용 자유 입력
        </label>

        {preview && (
          <div className={`preview${over ? ' over' : ''}`} aria-live="polite">
            <strong>예약하면 이렇게 돼요</strong>
            {!preview.ok && <p className="small">{preview.reason}</p>}
            {preview.ok && !preview.has_membership && (
              <p>이 날짜에는 이용할 수 있는 멤버십이 없어요. <Link href="/">내 현황</Link>에서 멤버십을 신청하거나 멤버십 기간 안의 날짜를 골라 주세요.</p>
            )}
            {preview.ok && preview.has_membership && (
              <>
                <p>{fmtMin(preview.minutes)} 사용해요.</p>
                <ul>
                  {preview.parts.map((p: any, i: number) => (
                    <li key={i}>{p.member_name} ({p.member_type === 'individual' ? '개인' : '회사'}) 시간에서 {fmtMin(p.minutes)} 차감 → 남은 시간 {fmtMin(p.remaining_after)}</li>
                  ))}
                </ul>
                {over && (
                  <p className="warn">
                    이번 주기 한도를 {fmtMin(preview.overage_minutes)} 넘어요. 넘은 시간에 대해 <b>{preview.overage_amount.toLocaleString('ko-KR')}원</b>이 청구돼요. (시간당 {preview.overage_per_hour.toLocaleString('ko-KR')}원)
                  </p>
                )}
              </>
            )}
            {preview.ok && preview.capacity_warning && <p className="warn">{preview.capacity_warning}</p>}
          </div>
        )}
      </form>
      <ErrorBox error={error} />
      {result && (
        <OkBox>
          <strong>{result.message}</strong>
          {result.charged?.length > 0 && (
            <ul>{result.charged.map((c: any, i: number) => <li key={i}>{c.member_name} 멤버십에서 {fmtMin(c.minutes)} 차감</li>)}</ul>
          )}
          {result.overage_minutes > 0 && <div>한도 초과 {fmtMin(result.overage_minutes)}</div>}
          <div><Link href="/reservations">내 예약 보기 →</Link></div>
        </OkBox>
      )}
    </>
  );
}
