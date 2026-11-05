'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, setAuth } from '@/lib/api';
import { ErrorBox } from './ErrorBox';

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
      <h1>모퉁이 {signup ? '회원가입' : '로그인'}</h1>
      <form onSubmit={submit} className="card">
        <label>이메일<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>비밀번호 (8자 이상)<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {signup && <label>이름<input value={name} onChange={(e) => setName(e.target.value)} /></label>}
        <button disabled={busy}>{signup ? '가입하기' : '로그인'}</button>
        <ErrorBox error={error} />
      </form>
      <p className="small">
        {signup ? <>이미 계정이 있나요? <Link href="/login">로그인</Link></> : <>처음이세요? <Link href="/signup">회원가입</Link></>}
      </p>
    </div>
  );
}
