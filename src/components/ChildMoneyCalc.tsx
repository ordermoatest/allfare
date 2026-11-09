'use client';
import { useState } from 'react';
import { Row, Seg, won } from './CalcParts';

// 2026년 기준 (보건복지부)
const ALLOW: Record<string, number> = { metro: 100000, local: 105000, dec1: 115000, dec2: 120000 };
const ALLOW_MONTHS = 108; // 2026년 아동수당: 만 9세 미만

/** 우리 아이 매달 받는 돈 계산기: 부모급여 + 아동수당 + 가정양육수당 + 첫만남이용권 */
export default function ChildMoneyCalc() {
  const now = new Date(Date.now() + 9 * 3600000);
  const ny = now.getUTCFullYear(), nm = now.getUTCMonth() + 1;
  const [ym, setYm] = useState('');
  const [order, setOrder] = useState<'1' | '2'>('1');
  const [area, setArea] = useState<'metro' | 'local' | 'dec1' | 'dec2'>('metro');
  const [care, setCare] = useState<'home' | 'daycare'>('home');
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  const months = m ? (ny * 12 + nm) - (+m[1] * 12 + +m[2]) : null;
  const lines: { t: string; v: number | null; note?: string }[] = [];
  const after = (k: number) => { if (!m) return ''; const t = +m[1] * 12 + (+m[2] - 1) + k; return `${Math.floor(t / 12)}년 ${(t % 12) + 1}월`; };
  if (months !== null && months >= 0) {
    if (months < 12) lines.push(care === 'home' ? { t: '부모급여 (만 0세)', v: 1000000 } : { t: '부모급여 (만 0세)', v: null, note: '보육료 바우처로 받고, 보육료를 뺀 나머지를 현금으로 받아요' });
    else if (months < 24) lines.push(care === 'home' ? { t: '부모급여 (만 1세)', v: 500000 } : { t: '부모급여 (만 1세)', v: null, note: '보육료 바우처로 바뀌어요' });
    if (months < ALLOW_MONTHS) lines.push({ t: '아동수당', v: ALLOW[area] });
    if (months >= 24 && months < 86 && care === 'home') lines.push({ t: '가정양육수당', v: 100000 });
  }
  const total = lines.reduce((s, l) => s + (l.v || 0), 0);
  const voucher = months !== null && months >= 0 && months < 12 ? (order === '1' ? 2000000 : 3000000) : 0;
  const next: string[] = [];
  if (months !== null && months >= 0) {
    if (months < 12) next.push(`${after(12)}부터 부모급여가 월 50만원으로 바뀌어요.`);
    if (months < 24) next.push(`${after(24)}부터 부모급여가 끝나요.${care === 'home' ? ' 집에서 키우면 가정양육수당 월 10만원을 받아요.' : ''}`);
    if (months < ALLOW_MONTHS) next.push('2027년부터 아동수당은 만 10세 미만까지 받아요. 해마다 한 살씩 늘어 2030년에는 만 13세 미만까지예요.');
  }
  return (
    <div className="gcalc">
      <b className="gcalc-t">우리 아이, 매달 얼마 받을까요?</b>
      <Row label="아이 태어난 달" htmlFor="cbirth"><input id="cbirth" className="cmonth" type="month" value={ym} max={`${ny}-${String(nm).padStart(2, '0')}`} onChange={(e) => setYm(e.target.value)} /></Row>
      <Row label="몇째 아이인가요" col><Seg label="출생 순서" value={order} onChange={setOrder} options={[['1', '첫째'], ['2', '둘째 이상']]} /></Row>
      <Row label="사는 곳" col><Seg label="사는 곳" value={area} onChange={setArea} options={[['metro', '수도권'], ['local', '비수도권'], ['dec1', '인구감소 우대'], ['dec2', '인구감소 특별']]} /></Row>
      <Row label="어린이집·유치원" col><Seg label="어린이집 이용" value={care} onChange={setCare} options={[['home', '집에서 키워요'], ['daycare', '다니고 있어요']]} /></Row>
      <div className="gcalc-res" aria-live="polite">
        {months === null ? <>아이가 태어난 달을 넣으면 이번 달 받는 금액을 계산해 드려요.</>
          : months < 0 ? <>아직 태어나지 않았어요. 태어나면 첫만남이용권 <b>{order === '1' ? '200만원' : '300만원'}</b>과 부모급여 <b>월 100만원</b>, 아동수당 <b>월 {won(ALLOW[area])}</b>을 받을 수 있어요.</>
          : <>
              {total > 0 ? <>이번 달 현금으로 <b>월 {won(total)}</b>을 받아요.</> : <>현금으로 받는 수당은 없어요.</>}
              <ul className="cres">
                {lines.map((l) => <li key={l.t}><span>{l.t}</span><b>{l.v === null ? '바우처' : won(l.v)}</b>{l.note && <small>{l.note}</small>}</li>)}
                {voucher > 0 && <li><span>첫만남이용권 (한 번)</span><b>{won(voucher)}</b><small>국민행복카드 포인트, 태어난 날부터 1년 안에 써야 해요</small></li>}
                {!lines.length && <li><span>2026년 기준 받는 수당이 없어요</span><b>-</b></li>}
              </ul>
              {next.length > 0 && <ul className="cnext">{next.map((t) => <li key={t}>{t}</li>)}</ul>}
            </>}
      </div>
      <a className="gcta" href="/?tab=my">우리 집이 받을 수 있는 혜택 더 찾기 →</a>
    </div>
  );
}
