'use client';
import { useEffect, useState } from 'react';
import { GUIDES } from '@/lib/guides';
import { upcoming } from '@/lib/events';
import { track } from '@/lib/client';
import { Logo } from './Brand';
import PopularNews from './PopularNews';
import { IcCalc, IcChevron, IcShare } from './icons';

type Tab = 'home' | 'culture' | 'explore' | 'my';
export type PcActive = 'home' | 'culture' | 'region' | 'guide' | 'news' | 'my' | '';
const PICK = ['youth-rent', 'parent-benefit', 'basic-pension'];

/**
 * PC(넓은 화면) 상단 메뉴바 — 폰에서는 숨김
 * 메인(/)에서는 go로 탭만 바꾸고, 다른 페이지에서는 주소로 이동
 */
export function PcTop({ active, go, onShare, hasProfile }: { active: PcActive; go?: (t: Tab) => void; onShare: () => void; hasProfile: boolean }) {
  const [open, setOpen] = useState(false);
  const to = (t: Tab, href: string) => () => { track('pc_menu', { to: t }); if (go) go(t); else location.href = href; };
  const culture = active === 'culture' || active === 'region';
  return (
    <header className="pctop">
      <div className="pctopin">
        <button className="pclogo" onClick={to('home', '/')} aria-label="올페어 처음으로"><Logo size={34} /><b>올페어</b><small>All <i>wel</i>Fare</small></button>
        <nav className="pcmenu" aria-label="메인 메뉴">
          <button className={active === 'home' ? 'on' : ''} onClick={to('home', '/')}>맞춤 혜택</button>
          <div className={`pcdrop ${open ? 'open' : ''}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <button className={culture ? 'on' : ''} onClick={to('culture', '/?tab=culture')} aria-haspopup="true" aria-expanded={open}
              onFocus={() => setOpen(true)}>문화누리 사용처 <span className="caret" aria-hidden>▾</span></button>
            <div className="pcdmenu" role="menu">
              <button role="menuitem" onClick={to('culture', '/?tab=culture')}><b>📍 내 주변 지도로 찾기</b><small>가까운 가맹점과 결제 후기</small></button>
              <a role="menuitem" href="/culture" onClick={() => track('pc_menu', { to: 'region' })}><b>📋 지역별 목록으로 찾기</b><small>시·도, 시·군·구별 가맹점</small></a>
            </div>
          </div>
          <a className={active === 'guide' ? 'on' : ''} href={go ? undefined : '/guide'} onClick={(e) => { if (go) { e.preventDefault(); go('explore'); } track('pc_menu', { to: 'guide' }); }} role={go ? 'button' : undefined} style={{ cursor: 'pointer' }}>복지 가이드</a>
          <a className={active === 'news' ? 'on' : ''} href="/news" onClick={() => track('pc_menu', { to: 'news' })}>복지 소식</a>
        </nav>
        <div className="pctopr">
          <button className="pcbtn" onClick={onShare}><IcShare size={16} />공유</button>
          <button className={`pcbtn pri ${active === 'my' ? 'on' : ''}`} onClick={to('my', '/?tab=my')}>{hasProfile ? '내 조건 수정' : '내 조건 입력하기'}</button>
        </div>
      </div>
    </header>
  );
}

/** PC(넓은 화면)에서만 보이는 양옆 — 왼쪽: 소개·일정·QR / 오른쪽: 바로가기·인기 소식·가이드·공유 */
export default function PcSide({ onShare, onMy }: { onShare: () => void; onMy: () => void }) {
  const picks = PICK.map((s) => GUIDES.find((g) => g.slug === s)).filter(Boolean) as typeof GUIDES;
  // 날짜 계산은 브라우저에서 (서버와 하루 차이 방지)
  const [evs, setEvs] = useState<ReturnType<typeof upcoming>>([]);
  const [today, setToday] = useState('');
  useEffect(() => {
    setEvs(upcoming(5));
    const n = new Date(Date.now() + 9 * 3600000);
    setToday(`${n.getUTCMonth() + 1}월 ${n.getUTCDate()}일 기준`);
  }, []);

  return (
    <>
      <aside className="pcside left" aria-label="올페어 소개와 일정">
        <div className="pcintro">
          <h2>내가 받을 수 있는 복지 혜택, 1분이면 찾아요</h2>
          <p>정부·지자체 혜택 1만여 개 중에서 나에게 맞는 것만 골라드려요. 로그인 없이 무료예요.</p>
        </div>
        {evs.length > 0 && (
          <section>
            <p className="pclbl">놓치면 안 되는 일정{today && <small>{today}</small>}</p>
            <div className="pcev">
              {evs.map((e) => (
                <a key={e.title} href={`/guide/${e.slug}`} onClick={() => track('pc_event', { slug: e.slug })}>
                  <span className="pcdate"><b>{e.label}</b><em className={e.hot ? 'hot' : ''}>{e.dday}</em></span>
                  <span><b>{e.title}</b><small>{e.sub}</small></span>
                </a>
              ))}
            </div>
          </section>
        )}
        <div className="pcqr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qr.svg" alt="올페어 바로가기 QR코드" width={72} height={72} />
          <div><b>폰으로 보면 더 편해요</b><small>카메라로 비추면 바로 열려요</small></div>
        </div>
      </aside>

      <aside className="pcside right" aria-label="바로가기">
        <section>
          <p className="pclbl">바로가기</p>
          <div className="pclinks">
            <a href="/guide/median-income" onClick={() => track('pc_side', { to: 'calc' })}><IcCalc />기준중위소득 계산기<IcChevron size={15} /></a>
            <a href="/guide/culture-nuri-card" onClick={() => track('pc_side', { to: 'culture-guide' })}><span className="pcemo" aria-hidden>🎫</span>문화누리카드 안내<IcChevron size={15} /></a>
          </div>
        </section>
        <section>
          <p className="pclbl">인기 복지 소식</p>
          <PopularNews variant="side" from="pc_side" />
          <a className="pcmore" href="/news">소식 전체 보기 →</a>
        </section>
        <section>
          <p className="pclbl">많이 찾는 복지 가이드</p>
          <div className="pcguides">
            {picks.map((g) => (
              <a key={g.slug} href={`/guide/${g.slug}`} onClick={() => track('pc_side', { to: g.slug })}><b>{g.title}</b>{g.sub && <small>{g.sub}</small>}</a>
            ))}
          </div>
          <a className="pcmore" href="/guide">가이드 전체 보기 →</a>
        </section>
        <div className="pcsharebox">
          <b>가족·친구에게 알려주세요</b>
          <p>받을 수 있는 혜택을 몰라서 놓치는 경우가 많아요</p>
          <button onClick={onShare}><IcShare size={16} />올페어 공유하기</button>
        </div>
      </aside>
    </>
  );
}
