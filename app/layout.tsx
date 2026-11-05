import './globals.css';
export const metadata = { title: '모퉁이', description: '모퉁이 공유 오피스' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
