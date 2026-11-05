'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAuth, getName, getToken } from '@/lib/api';

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setName(getName() || '');
    setReady(true);
  }, [router]);
  if (!ready) return <p className="small" style={{ padding: 24 }}>불러오는 중…</p>;
  const links = [['/', '내 현황'], ['/rooms', '회의실 예약'], ['/reservations', '내 예약']];
  return (
    <>
      <nav className="nav">
        <div className="nav-top">
          <strong className="brand">모퉁이</strong>
          <span className="spacer" />
          <span className="small">{name}님</span>
          <button className="link" onClick={() => { clearAuth(); router.replace('/login'); }}>로그아웃</button>
        </div>
        <div className="tabs">
          {links.map(([h, l]) => (
            <Link key={h} href={h} className={path === h ? 'active' : ''}>{l}</Link>
          ))}
        </div>
      </nav>
      <main className="main">{children}</main>
    </>
  );
}
