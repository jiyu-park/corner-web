import './globals.css';
export const metadata = { title: '모퉁이', description: '모퉁이 공유 오피스' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
