'use client';
import { useCallback, useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { ErrorBox, OkBox } from '@/components/ErrorBox';
import { api, fmtMin } from '@/lib/api';

const TIMES: string[] = [];
for (let m = 8 * 60; m <= 22 * 60; m += 30) TIMES.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`);
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function Page() {
  return <Shell><Rooms /></Shell>;
}

function Rooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomId, setRoomId] = useState<number | ''>('');
  const [date, setDate] = useState(today());
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('11:00');
  const [people, setPeople] = useState('2');
  const [free, setFree] = useState(false);
  const [day, setDay] = useState<any[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await api('/reservations', {
        method: 'POST',
        body: { meeting_room_id: roomId === '' ? undefined : roomId, reserved_date: date, start_time: start, end_time: end, people_count: people === '' ? undefined : Number(people) },
      });
      setResult(r);
      await loadDay();
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  const slots = Array.from({ length: 28 }, (_, i) => {
    const s = 8 * 60 + i * 30;
    return day.some((r) => toMin(r.start_time) < s + 30 && toMin(r.end_time) > s);
  });

  return (
    <>
      <h1>회의실 예약</h1>
      <h2>회의실</h2>
      <table>
        <thead><tr><th>이름</th><th>정원</th><th>화상장비</th></tr></thead>
        <tbody>{rooms.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.max_people}명</td><td>{r.has_video ? '있음' : '없음'}</td></tr>)}</tbody>
      </table>

      <h2>그날 예약 현황</h2>
      <div className="card">
        <div className="timeline">{slots.map((b, i) => <div key={i} className={b ? 'busy' : 'free'} />)}</div>
        <div className="ticks">{['08', '10', '12', '14', '16', '18', '20'].map((h) => <span key={h}>{h}:00</span>)}</div>
        {day.length === 0 ? <p className="small">이 날은 예약이 없어요.</p> : (
          <ul>{day.map((r) => <li key={r.id}>{r.start_time}~{r.end_time} ({fmtMin(toMin(r.end_time) - toMin(r.start_time))}) · {r.status === 'reserved' ? '예약됨' : r.status === 'completed' ? '사용 완료' : r.status === 'no_show' ? '노쇼' : r.status}</li>)}</ul>
        )}
      </div>

      <h2>예약하기</h2>
      <form className="card" onSubmit={submit}>
        <div className="row">
          <label>회의실
            <select value={roomId} onChange={(e) => setRoomId(Number(e.target.value))}>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label>날짜<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label>시작
            {free ? <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              : <select value={start} onChange={(e) => setStart(e.target.value)}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select>}
          </label>
          <label>끝
            {free ? <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              : <select value={end} onChange={(e) => setEnd(e.target.value)}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select>}
          </label>
          <label>참석 인원<input type="number" value={people} onChange={(e) => setPeople(e.target.value)} style={{ width: 90 }} /></label>
          <button disabled={busy}>예약</button>
        </div>
        <label style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, fontSize: 11 }}>
          <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> 개발자용 자유 입력
        </label>
      </form>
      <ErrorBox error={error} />
      {result && (
        <OkBox>
          <strong>{result.message}</strong>
          {result.charged?.length > 0 && (
            <ul>{result.charged.map((c: any, i: number) => <li key={i}>{c.member_name} 멤버십에서 {fmtMin(c.minutes)} 차감</li>)}</ul>
          )}
          {result.overage_minutes > 0 && <div>한도 초과 {fmtMin(result.overage_minutes)}</div>}
        </OkBox>
      )}
    </>
  );
}
