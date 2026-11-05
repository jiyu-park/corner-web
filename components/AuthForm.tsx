'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, setAuth } from '@/lib/api';
import { ErrorBox } from './ErrorBox';
import { LogoMark } from './Logo';

// 체험용 계정 안내는 환경 변수로 켠다. 값이 없으면 화면에 나오지 않는다.
const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (signup) {
        const r = await api('/auth/signup', { method: 'POST', body: { email, password, name }, auth: false });
        setAuth(r.token, r.user.name);
      } else {
        const r = await api('/auth/login', { method: 'POST', body: { email, password, app: 'web' }, auth: false });
        setAuth(r.token, r.user.name);
      }
      router.replace('/');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-logo"><LogoMark size={56} /></div>
      <h1>모퉁이 {signup ? '회원가입' : '로그인'}</h1>
      <form onSubmit={submit} className="card">
        <label>이메일<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>비밀번호 (8자 이상)<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {signup && <label>이름<input value={name} onChange={(e) => setName(e.target.value)} /></label>}
        <button disabled={busy}>{signup ? '가입하기' : '로그인'}</button>
        <ErrorBox error={error} />
      </form>
      {!signup && demoEmail && demoPassword && (
        <div className="demo">
          <strong>체험용 계정</strong>
          <p className="small">
            이메일 <code>{demoEmail}</code>
            <br />
            비밀번호 <code>{demoPassword}</code>
          </p>
          <button
            type="button"
            className="sub"
            onClick={() => {
              setEmail(demoEmail);
              setPassword(demoPassword);
            }}
          >
            체험용 계정으로 채우기
          </button>
        </div>
      )}
      <p className="small">
        {signup ? <>이미 계정이 있나요? <Link href="/login">로그인</Link></> : <>처음이세요? <Link href="/signup">회원가입</Link></>}
      </p>
    </div>
  );
}
