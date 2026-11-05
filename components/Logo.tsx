// "모퉁이" 로고: 방의 모서리(ㄱ자 벽) 안에 사람이 서 있는 모양.
// variant: 'blue' = 파란 바탕에 흰 모양(기본), 'white' = 흰 바탕에 파란 모양(어두운 배경 위)
export function LogoMark({ size = 28, variant = 'blue' }: { size?: number; variant?: 'blue' | 'white' }) {
  const bg = variant === 'blue' ? '#0078FF' : '#FFFFFF';
  const fg = variant === 'blue' ? '#FFFFFF' : '#0033A9';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="모퉁이 로고" style={{ display: 'block', flex: 'none' }}>
      <rect width="64" height="64" rx="16" fill={bg} />
      <path d="M46 19H25a6 6 0 0 0-6 6v21" fill="none" stroke={fg} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="41" cy="41" r="6" fill={fg} />
    </svg>
  );
}

export function Logo({ size = 28, text = '모퉁이', variant = 'blue' }: { size?: number; text?: string; variant?: 'blue' | 'white' }) {
  return (
    <span className="logo">
      <LogoMark size={size} variant={variant} />
      <span className="logo-text">{text}</span>
    </span>
  );
}
