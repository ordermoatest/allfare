'use client';
import { useState } from 'react';
import { bracketOf, medianOf } from '@/lib/profile';

/** 가이드용 기준중위소득 계산기 */
export default function MedianCalc() {
  const [hh, setHh] = useState(1);
  const [mi, setMi] = useState('');
  const med = medianOf(hh);
  const m = parseInt(mi, 10);
  const pct = m ? Math.round(((m * 10000) / med) * 100) : null;
  return (
    <div className="gcalc">
      <b className="gcalc-t">🧮 우리 집은 몇 %일까요?</b>
      <div className="gcalc-row">
        <span>가구원 수</span>
        <div className="step">
          <button aria-label="가구원 줄이기" onClick={() => setHh(Math.max(1, hh - 1))}>−</button>
          <b>{hh}명</b>
          <button aria-label="가구원 늘리기" onClick={() => setHh(Math.min(10, hh + 1))}>+</button>
        </div>
      </div>
      <div className="gcalc-row">
        <label htmlFor="gmi">가구 월 소득 (세전 합계)</label>
        <div className="money"><input id="gmi" inputMode="numeric" placeholder="예: 300" value={mi} onChange={(e) => setMi(e.target.value.replace(/\D/g, '').slice(0, 5))} /><span>만원</span></div>
      </div>
      <div className="gcalc-res" aria-live="polite">
        {pct === null
          ? <>{hh}인 가구의 기준중위소득(100%)은 <b>월 {Math.round(med / 10000).toLocaleString()}만원</b>이에요.</>
          : <>기준중위소득의 약 <b>{pct}%</b>예요. 올페어 구간으로는 <b>{bracketOf(pct)}</b>에 해당해요.</>}
      </div>
      <a className="gcta" href="/?tab=my">이 소득으로 받을 수 있는 혜택 찾기 →</a>
    </div>
  );
}
