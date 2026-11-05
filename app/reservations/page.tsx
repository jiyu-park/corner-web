'use client';
import { useCallback, useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { ErrorBox, OkBox } from '@/components/ErrorBox';
import { api, fmtMin, STATUS_LABEL } from '@/lib/api';

export default function Page() {
  return <Shell><Mine /></Shell>;
}

function Mine() {
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [people, setPeople] = useState('');

  const load = useCallback(() => api('/reservations/mine').then(setList).catch(setError), []);
  useEffect(() => { load(); }, [load]);

  async function cancel(id: number) {
    setError(null); setMsg('');
    try { const r = await api(`/reservations/${id}/cancel`, { method: 'POST' }); setMsg(r.message); await load(); }
    catch (e) { setError(e); }
  }
  async function savePeople(id: number) {
    setError(null); setMsg('');
    try {
      await api(`/reservations/${id}`, { method: 'PATCH', body: { people_count: people === '' ? undefined : Number(people) } });
      setMsg('인원을 수정했어요.'); setEditing(null); await load();
    } catch (e) { setError(e); }
  }

  return (
    <>
      <h1>내 예약</h1>
      <ErrorBox error={error} />
      <OkBox>{msg}</OkBox>
      {!list ? <p className="small">불러오는 중…</p> : list.length === 0 ? <p className="small">예약이 없어요.</p> : (
        <table>
          <thead><tr><th>날짜</th><th>시간</th><th>방</th><th>인원</th><th>상태</th><th>차감</th><th></th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>{String(r.reserved_date).slice(0, 10)}</td>
                <td>{r.start_time}~{r.end_time}</td>
                <td>{r.room_name}</td>
                <td>
                  {editing === r.id ? (
                    <>
                      <input type="number" value={people} onChange={(e) => setPeople(e.target.value)} style={{ width: 64 }} />{' '}
                      <button onClick={() => savePeople(r.id)}>저장</button>{' '}
                      <button className="sub" onClick={() => setEditing(null)}>닫기</button>
                    </>
                  ) : `${r.people_count}명`}
                </td>
                <td>
                  <span className={`tag ${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span>
                  {r.correction_reason && <div className="small">정정: {r.correction_reason}</div>}
                </td>
                <td>{fmtMin(r.charged_minutes)}</td>
                <td>
                  {r.status === 'reserved' && editing !== r.id && (
                    <>
                      <button className="sub" onClick={() => { setEditing(r.id); setPeople(String(r.people_count)); }}>인원 수정</button>{' '}
                      <button className="danger" onClick={() => cancel(r.id)}>취소</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
