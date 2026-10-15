// 올페어 로고 (기울어진 AF 혜택 태그) + 이름·슬로건
export function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="올페어 로고" style={{ flex: 'none', display: 'block' }}>
      <rect width="100" height="100" rx="26" fill="#0F8A68" />
      <g transform="rotate(-10 50 52)">
        <path d="M50 13 L76 36 L76 79 Q76 85 70 85 L30 85 Q24 85 24 79 L24 36 Z" fill="#fff" stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
        <circle cx="50" cy="32" r="4.5" fill="#0F8A68" />
        <g fill="none" stroke="#0F8A68" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M31 75 L39 50 L47 75" /><path d="M34.5 66 L43.5 66" />
          <path d="M65 50 L55.5 50 L55.5 75" /><path d="M55.5 62 L63 62" />
        </g>
      </g>
      <path d="M45.5 30 Q50 16 62 10" fill="none" stroke="#FFC857" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Brand({ href, onClick }: { href?: string; onClick?: () => void }) {
  const body = (
    <>
      <Logo />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span className="brandname">올페어</span>
          <span className="slogan">All <span className="wel">wel</span>Fare</span>
        </div>
        <div className="cap">내 혜택, 내 주변 사용처 한 번에</div>
      </div>
    </>
  );
  if (href) return <a href={href} className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>{body}</a>;
  if (onClick) return <button className="brand brandbtn" onClick={onClick} aria-label="혜택 탭 처음으로">{body}</button>;
  return <div className="brand">{body}</div>;
}
