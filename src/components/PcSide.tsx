'use client';
import { useEffect, useState } from 'react';
import { GUIDES } from '@/lib/guides';
import { upcoming } from '@/lib/events';
import { track } from '@/lib/client';
import { Logo } from './Brand';
import { IcCalc, IcChevron, IcMap, IcShare, IcSliders } from './icons';

type Tab = 'home' | 'culture' | 'explore' | 'my';
const PICK = ['youth-rent', 'parent-benefit', 'basic-pension', 'work-incentive'];

/** PC(넓은 화면) 상단 메뉴바 — 폰에서는 숨김 */
export function PcTop({ tab, go, onShare, hasProfile }: { tab: Tab; go: (t: Tab) => void; onShare: () => void; hasProfile: boolean }) {
  const item = (t: Tab, label: string) => (
    <button className={tab === t ? 'on' : ''} aria-current={tab === t ? 'page' : undefined} onClick={() => { go(t); track('pc_menu', { to: t }); }}>{label}</button>
  );
  return (
    <header className="pctop">
      <div className="pctopin">
        <button className="pclogo" onClick={() => go('home')} aria-label="올페어 처음으로"><Logo size={34} /><b>올페어</b><small>All <i>wel</i>Fare</small></button>
        <nav className="pcmenu" aria-label="메인 메뉴">
          {item('home', '맞춤 혜택')}
          {item('culture', '문화누리 사용처')}
          <a href="/culture" onClick={() => track('pc_menu', { to: 'region' })}>지역별 사용처</a>
          {item('explore', '복지 가이드')}
        </nav>
        <div className="pctopr">
          <button className="pcbtn" onClick={onShare}><IcShare size={16} />공유</button>
          <button className={`pcbtn pri ${tab === 'my' ? 'on' : ''}`} onClick={() => { go('my'); track('pc_menu', { to: 'my' }); }}>{hasProfile ? '내 조건 수정' : '내 조건 입력하기'}</button>
        </div>
      </div>
    </header>
  );
}

/** PC(넓은 화면)에서만 보이는 양옆 — 왼쪽: 소개·일정·QR / 오른쪽: 바로가기·가이드·공유 */
export default function PcSide({ onShare, goTab }: { onShare: () => void; goTab: (t: 'culture' | 'my') => void }) {
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
            <p className="pclbl">놓치면 안 되는 일정{today && ` · ${today}`}</p>
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
            <a href="/culture" onClick={() => track('pc_side', { to: 'region' })}><IcMap />지역별 사용처 목록<IcChevron size={15} /></a>
            <button onClick={() => { goTab('my'); track('pc_side', { to: 'my' }); }}><IcSliders size={18} />내 조건 입력하기<IcChevron size={15} /></button>
          </div>
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
