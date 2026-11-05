'use client';
import { ApiError } from '@/lib/api';

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const e = error as ApiError;
  const source = e.source;
  return (
    <div className="box err" role="alert">
      {source && (
        <span className={`badge ${source}`}>{source === 'db' ? 'DB가 거절했어요' : '백엔드가 거절했어요'}</span>
      )}
      <div className="msg">{e.message || String(error)}</div>
      {e.db_constraint && <div className="small">제약: {e.db_constraint}</div>}
    </div>
  );
}

export function OkBox({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <div className="box ok">{children}</div>;
}
