'use client';
import { useEffect, useState } from 'react';
import { deviceId } from '@/lib/profile';
import { shareLink, track } from '@/lib/client';
import { IcHeart, IcHeartFill, IcShare } from './icons';

type S = { views: number; likes: number; shares: number; liked: boolean };
// 숫자가 작을 때는 숨겨요 (처음에 '조회 3'이 보이면 오히려 인기 없어 보여서)
const MIN_VIEWS = 50, MIN_COUNT = 5;
const fmt = (n: number) => n.toLocaleString();

/** 복지 소식 상단 오른쪽(top) / 글 아래(bottom) 조회·좋아요·공유 */
export default function NewsStats({ slug, title, text, variant }: { slug: string; title: string; text: string; variant: 'top' | 'bottom' }) {
  const [s, setS] = useState<S>({ views: 0, likes: 0, shares: 0, liked: false });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const dev = deviceId();
    (async () => {
      // 조회수: 같은 기기는 하루 한 번만
      if (variant === 'top') {
        const k = `af-nv-${slug}`, today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
        let seen = false;
        try { seen = localStorage.getItem(k) === today; } catch { /* */ }
        if (!seen) {
          await fetch(`/api/news/${slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'view' }) }).catch(() => null);
          try { localStorage.setItem(k, today); } catch { /* */ }
        }
      }
      const r = await fetch(`/api/news/${slug}?device=${encodeURIComponent(dev)}`).then((x) => x.json()).catch(() => null);
      if (r && !r.error) setS({ views: r.views, likes: r.likes, shares: r.shares, liked: r.liked });
    })();
  }, [slug, variant]);

  const toast = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2600); };
  const like = async () => {
    setS((x) => ({ ...x, liked: !x.liked, likes: Math.max(0, x.likes + (x.liked ? -1 : 1)) }));
    const r = await fetch(`/api/news/${slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'like', device: deviceId() }) }).then((x) => x.json()).catch(() => null);
    if (r && !r.error) setS((x) => ({ ...x, liked: r.liked, likes: r.likes }));
    track('news_like', { slug });
  };
  const share = async () => {
    const r = await shareLink(title, text, location.origin + location.pathname);
    track('share_page', { from: `news_${variant}`, via: r });
    if (r === 'cancel' || r === 'fail') { if (r === 'fail') toast('공유하지 못했어요'); return; }
    if (r === 'copied') toast('링크를 복사했어요. 원하는 곳에 붙여넣어 보내세요');
    const x = await fetch(`/api/news/${slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'share' }) }).then((y) => y.json()).catch(() => null);
    if (x && typeof x.shares === 'number') setS((v) => ({ ...v, shares: x.shares }));
  };

  if (variant === 'top') {
    return (
      <div className="nstats">
        {s.views >= MIN_VIEWS && <span title="조회수">👁 {fmt(s.views)}</span>}
        <button className={s.liked ? 'on' : ''} onClick={like} aria-pressed={s.liked} aria-label="좋아요">
          {s.liked ? <IcHeartFill size={14} /> : <IcHeart size={15} />}{s.likes >= MIN_COUNT && <em>{fmt(s.likes)}</em>}
        </button>
        <button onClick={share} aria-label="공유하기"><IcShare size={15} />{s.shares >= MIN_COUNT && <em>{fmt(s.shares)}</em>}</button>
        {msg && <div className="toast" role="status">{msg}</div>}
      </div>
    );
  }
  return (
    <div className="nact">
      <button className={`nlike ${s.liked ? 'on' : ''}`} onClick={like} aria-pressed={s.liked}>
        {s.liked ? <IcHeartFill size={16} /> : <IcHeart size={18} />}도움 됐어요{s.likes >= MIN_COUNT && <em>{fmt(s.likes)}</em>}
      </button>
      <button className="nshare" onClick={share}><IcShare size={18} />이 소식 공유하기</button>
      {msg && <div className="toast" role="status">{msg}</div>}
    </div>
  );
}
