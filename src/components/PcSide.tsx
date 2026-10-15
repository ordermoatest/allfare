'use client';
import { GUIDES } from '@/lib/guides';
import { track } from '@/lib/client';
import { IcShare } from './icons';

const PICK = ['youth-rent', 'parent-benefit', 'child-allowance', 'basic-pension', 'work-incentive', 'k-pass'];

/** PC(넓은 화면)에서만 보이는 양옆 안내 — 가운데 앱 화면은 그대로 */
export default function PcSide({ onShare, goTab }: { onShare: () => void; goTab: (t: 'culture' | 'my') => void }) {
  const picks = PICK.map((s) => GUIDES.find((g) => g.slug === s)).filter(Boolean) as typeof GUIDES;
  return (
    <>
      <aside className="pcside left" aria-label="올페어 소개">
        <div className="pcbrand">
          <img src="/icon-192.png" alt="" width={56} height={56} />
          <div><b>올페어</b><span>All <i>wel</i>Fare</span></div>
        </div>
        <p className="pclead">내가 받을 수 있는 복지 혜택,<br />1분이면 찾아요</p>
        <ul className="pcfeat">
          <li><span>🎁</span><div><b>내 조건에 맞는 혜택</b><small>정부·지자체 혜택 1만여 개 중에서 골라드려요</small></div></li>
          <li><span>📍</span><div><b>문화누리카드 사용처 지도</b><small>내 주변 가맹점과 결제 후기를 한눈에</small></div></li>
          <li><span>🔒</span><div><b>로그인 없이 무료</b><small>입력한 조건은 이 기기에만 저장돼요</small></div></li>
        </ul>
        <div className="pcqr">
          <img src="/qr.svg" alt="올페어 바로가기 QR코드" width={112} height={112} />
          <div><b>폰으로 보면 더 편해요</b><small>카메라로 QR코드를 비추면 바로 열려요</small></div>
        </div>
      </aside>

      <aside className="pcside right" aria-label="바로가기">
        <div className="pccard">
          <h3>바로가기</h3>
          <a className="pclink" href="/guide/median-income" onClick={() => track('pc_side', { to: 'calc' })}><span>🧮</span>기준중위소득 계산기<em>›</em></a>
          <button className="pclink" onClick={() => { goTab('culture'); track('pc_side', { to: 'culture' }); }}><span>📍</span>내 주변 문화누리 사용처<em>›</em></button>
          <a className="pclink" href="/culture" onClick={() => track('pc_side', { to: 'region' })}><span>🗺️</span>지역별 사용처 목록<em>›</em></a>
          <button className="pclink" onClick={() => { goTab('my'); track('pc_side', { to: 'my' }); }}><span>⚙️</span>내 조건 입력하기<em>›</em></button>
        </div>
        <div className="pccard">
          <h3>많이 찾는 복지 가이드</h3>
          {picks.map((g) => (
            <a key={g.slug} className="pclink" href={`/guide/${g.slug}`} onClick={() => track('pc_side', { to: g.slug })}><span>{g.emoji}</span>{g.title.replace(/[,?].*$/, '')}<em>›</em></a>
          ))}
          <a className="pcmore" href="/guide">가이드 전체 보기 ›</a>
        </div>
        <button className="pcshare" onClick={onShare}><IcShare size={18} />가족·친구에게 올페어 알려주기</button>
      </aside>
    </>
  );
}
