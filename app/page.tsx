'use client';
import { useCallback, useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { ErrorBox, OkBox } from '@/components/ErrorBox';
import { api, fmtMin } from '@/lib/api';

export default function Home() {
  return <Shell><Me /></Shell>;
}

function Me() {
  const [me, setMe] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, p] = await Promise.all([api('/me'), api('/plans')]);
      setMe(m);
      setPlans(p);
    } catch (e) { setError(e); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function pick(path: string, plan_id: number) {
    setBusy(true); setError(null); setMsg('');
    try {
      const r = await api(path, { method: 'POST', body: { plan_id } });
      setMsg(r.message || '처리됐어요.');
      await load();
    } catch (e) { setError(e); } finally { setBusy(false); }
  }

  if (!me) return <><ErrorBox error={error} /><p className="small">불러오는 중…</p></>;
  const member = me.member;
  const isCompany = member?.type === 'company';
  const hasMembership = me.wallets.some((w: any) => w.member_type === 'individual');
  const current = me.memberships.find((m: any) => {
    const t = me.today ?? new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // 한국 기준 오늘
    return m.start_date.slice(0, 10) <= t && m.end_date.slice(0, 10) >= t;
  });

  return (
    <>
      <h1>내 현황</h1>
      <ErrorBox error={error} />
      <OkBox>{msg}</OkBox>
      <div className="card">
        <span className="profile-name">{me.user.name}</span> <span className="small">{me.user.email}</span>
        <div>소속: {member ? `${member.type === 'company' ? '회사' : '개인'} · ${member.name}` : '없음'}</div>
        <div className="small">
          첫 노쇼·늦은 취소 면제: {me.free_pass_used ? '이미 사용했어요 (다음부터 50% 차감)' : '아직 사용하지 않았어요'}
        </div>
      </div>

      <h2>시간 지갑</h2>
      {me.wallets.length === 0 && <p className="small">지금 쓸 수 있는 시간 지갑이 없어요.</p>}
      {me.wallets.map((w: any) => {
        const over = w.remaining_minutes < 0;
        const pct = Math.min(100, w.total_minutes ? (w.used_minutes / w.total_minutes) * 100 : 0);
        return (
          <div className={`card ${over ? 'over' : ''}`} key={w.membership_id}>
            <div className="wallet-head">
              <div className="wallet-title">{w.member_name} · {w.plan_name} ({w.member_type === 'company' ? '회사' : '개인'})</div>
              <div className="small">{w.cycle_start} ~ {w.cycle_end}</div>
            </div>
            {!over && (
              <div className="wallet-remain">
                <span className="label">남은 시간</span>
                <span className="big">{fmtMin(w.remaining_minutes)}</span>
              </div>
            )}
            <div className={`bar ${over ? 'over' : ''}`}><div style={{ width: `${over ? 100 : pct}%` }} /></div>
            <div className="wallet-used"><span>사용 {fmtMin(w.used_minutes)}</span><span>전체 {fmtMin(w.total_minutes)}</span></div>
            {over && (
              <div className="box warn">
                한도를 {Math.abs(w.remaining_minutes)}분 넘었어요. 넘은 시간은 시간당 {me.overage_per_hour.toLocaleString('ko-KR')}원으로 청구돼요
              </div>
            )}
          </div>
        );
      })}

      <h2>멤버십</h2>
      {isCompany ? (
        <div className="box info">회사 멤버십은 회사 담당자가 관리해요. 개인 멤버십 신청·변경은 할 수 없어요.</div>
      ) : (
        <>
          {!hasMembership && <p className="small">이용 중인 멤버십이 없어요. 종류를 골라 신청해 주세요.</p>}
          {hasMembership && <p className="small">멤버십을 올리면 바로, 내리면 다음 주기부터 적용돼요.</p>}
          <div className="plans">
            {plans.map((p) => (
              <div className={`card ${current?.plan_name === p.name ? 'selected' : ''}`} key={p.id}>
                <span className="plan-name">{p.name}</span>
                <div className="plan-fee">월 {Number(p.monthly_fee).toLocaleString('ko-KR')}<span className="unit">원</span></div>
                <div className="small">월 {p.monthly_hours}시간</div>
                <button
                  disabled={busy}
                  onClick={() => pick(hasMembership ? '/me/membership/change' : '/me/membership', p.id)}
                >
                  {hasMembership ? '이 종류로 변경' : '신청'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <h2>멤버십 이력</h2>
      {me.memberships.length === 0 ? <p className="small">이력이 없어요.</p> : (
        <div className="table-wrap"><table>
          <thead><tr><th>종류</th><th>월 시간</th><th>시작</th><th>끝</th></tr></thead>
          <tbody>
            {me.memberships.map((m: any) => (
              <tr key={m.id}><td>{m.plan_name}{current?.id === m.id ? ' (현재)' : ''}</td><td>{m.monthly_hours}시간</td><td>{m.start_date.slice(0, 10)}</td><td>{m.end_date.slice(0, 10)}</td></tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  );
}
