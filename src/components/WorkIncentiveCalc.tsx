'use client';
import { useState } from 'react';
import { Money, num, Row, Seg, Step, won } from './CalcParts';

// 2026년 신청(2025년 소득) 기준 · 국세청. [증가 구간 끝, 평탄 구간 끝, 소득 상한, 최대 금액] (만원)
const EITC = { single: [400, 900, 2200, 165], one: [700, 1400, 3200, 285], two: [800, 1700, 4400, 330] } as const;
const CTC = { one: 2100, two: 2500 } as const; // 자녀장려금: 이 소득까지 1명당 100만원, 7,000만원까지 50만원으로 줄어듦

function eitc(t: keyof typeof EITC, x: number): number {
  const [a, b, c, mx] = EITC[t];
  if (x <= 0 || x >= c) return 0;
  if (x < a) return (x * mx) / a;
  if (x <= b) return mx;
  return mx - ((x - b) * mx) / (c - b);
}
function ctc(t: 'one' | 'two', x: number, kids: number): number {
  if (!kids || x >= 7000) return 0;
  const s = CTC[t];
  const per = x < s ? 100 : 100 - ((x - s) * 50) / (7000 - s);
  return per * kids;
}

/** 근로장려금·자녀장려금 예상 계산기 (참고용) */
export default function WorkIncentiveCalc() {
  const [t, setT] = useState<'single' | 'one' | 'two'>('single');
  const [inc, setInc] = useState('');
  const [kids, setKids] = useState(0);
  const [prop, setProp] = useState<'lo' | 'mid' | 'hi'>('lo');
  const x = num(inc);
  const rate = prop === 'hi' ? 0 : prop === 'mid' ? 0.5 : 1;
  const e = eitc(t, x) * rate * 10000;
  const c = t === 'single' ? 0 : ctc(t, x, kids) * rate * 10000;
  return (
    <div className="gcalc">
      <b className="gcalc-t">근로장려금·자녀장려금, 얼마 받을까요?</b>
      <Row label="가구" col><Seg label="가구" value={t} onChange={(v) => { setT(v); if (v === 'single') setKids(0); }} options={[['single', '혼자 (단독)'], ['one', '홑벌이'], ['two', '맞벌이']]} /></Row>
      <p className="gsmall chelp">{t === 'single' ? '배우자·자녀·70세 이상 부모님 없이 혼자 사는 가구예요.' : t === 'one' ? '배우자나 18세 미만 자녀, 70세 이상 부모님이 있고, 배우자 소득이 연 300만원 미만인 가구예요.' : '배우자도 연 300만원 이상 버는 가구예요.'}</p>
      <Row label="작년 연 총소득 (부부 합)" htmlFor="winc"><Money id="winc" value={inc} onChange={setInc} placeholder="예: 1800" max={5} /></Row>
      {t !== 'single' && <Row label="18세 미만 자녀"><Step value={kids} set={setKids} min={0} max={6} unit="명" label="자녀 수" /></Row>}
      <Row label="가구 재산 합계" col><Seg label="재산" value={prop} onChange={setProp} options={[['lo', '1억 7천 미만'], ['mid', '1억 7천~2억 4천'], ['hi', '2억 4천 이상']]} /></Row>
      <div className="gcalc-res" aria-live="polite">
        {!x ? <>작년 소득을 넣으면 예상 금액을 계산해 드려요.</>
          : prop === 'hi' ? <>재산이 2억 4천만원 이상이면 받을 수 없어요.</>
          : e + c <= 0 ? <>소득이 기준({t === 'single' ? '2,200만원' : t === 'one' ? '3,200만원' : '4,400만원'} 미만{t !== 'single' ? ', 자녀장려금은 7,000만원 미만' : ''})을 넘어서 계산상으로는 받기 어려워요.</>
          : <>
              합쳐서 약 <b>{won(e + c)}</b>을 받을 수 있어요.
              <ul className="cres">
                <li><span>근로장려금</span><b>{won(e)}</b></li>
                {t !== 'single' && <li><span>자녀장려금{kids ? ` (${kids}명)` : ''}</span><b>{won(c)}</b>{!kids && <small>18세 미만 자녀가 있으면 받아요</small>}</li>}
              </ul>
              {prop === 'mid' && <small className="cwarn">재산이 1억 7천만원 이상이라 절반으로 계산했어요.</small>}
            </>}
      </div>
      <p className="gsmall">근로소득 기준이에요. 사업소득은 업종별 비율을 곱해서 계산해서 결과가 달라질 수 있어요. 정확한 금액은 홈택스에서 확인하세요.</p>
      <a className="gcta" href="/?tab=my">내 조건으로 받을 수 있는 혜택 더 찾기 →</a>
    </div>
  );
}
