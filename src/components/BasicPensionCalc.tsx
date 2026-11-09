'use client';
import { useState } from 'react';
import { Money, num, Row, Seg, won } from './CalcParts';

// 2026년 기준 (보건복지부 고시)
const LIMIT = { single: 2470000, couple: 3952000 };
const BASE = 349700;            // 기준연금액
const WORK_DED = 1160000;       // 근로소득 공제 (월)
const HOME_DED = { big: 135000000, mid: 85000000, rural: 72500000 };
const FIN_DED = 20000000;
const NPS_LINE = Math.round(BASE * 1.5); // 국민연금이 이보다 많으면 연계 감액될 수 있음

/** 기초연금 모의 계산기 (참고용) */
export default function BasicPensionCalc() {
  const [hh, setHh] = useState<'single' | 'couple'>('single');
  const [area, setArea] = useState<'big' | 'mid' | 'rural'>('big');
  const [w1, setW1] = useState(''); const [w2, setW2] = useState('');
  const [nps, setNps] = useState(''); const [etc, setEtc] = useState('');
  const [home, setHome] = useState(''); const [fin, setFin] = useState(''); const [debt, setDebt] = useState('');
  const M = 10000;
  const work = [w1, hh === 'couple' ? w2 : ''].reduce((s, x) => s + Math.max(0, num(x) * M - WORK_DED) * 0.7, 0);
  let g = num(home) * M - HOME_DED[area];
  let f = Math.max(0, num(fin) * M - FIN_DED);
  g -= num(debt) * M;
  if (g < 0) { f += g; g = 0; }
  f = Math.max(0, f);
  const prop = ((g + f) * 0.04) / 12;
  const income = work + num(nps) * M + num(etc) * M + prop;
  const limit = LIMIT[hh];
  const full = hh === 'single' ? BASE : Math.round(BASE * 0.8) * 2;
  const touched = [w1, w2, nps, etc, home, fin, debt].some((x) => x);
  const ok = income <= limit;
  let pay = full;
  if (ok && income + full > limit) pay = Math.max(limit - income, hh === 'single' ? BASE * 0.1 : BASE * 0.8 * 0.1 * 2);
  return (
    <div className="gcalc">
      <b className="gcalc-t">기초연금, 얼마 받을 수 있을까요?</b>
      <Row label="가구" col><Seg label="가구" value={hh} onChange={setHh} options={[['single', '혼자 (단독)'], ['couple', '부부']]} /></Row>
      <Row label="사는 곳" col><Seg label="사는 곳" value={area} onChange={setArea} options={[['big', '서울·광역시'], ['mid', '그 밖의 시'], ['rural', '군 지역']]} /></Row>
      <Row label={hh === 'couple' ? '본인 월 근로소득' : '월 근로소득'} htmlFor="bw1"><Money id="bw1" value={w1} onChange={setW1} max={4} /></Row>
      {hh === 'couple' && <Row label="배우자 월 근로소득" htmlFor="bw2"><Money id="bw2" value={w2} onChange={setW2} max={4} /></Row>}
      <Row label="월 국민연금" htmlFor="bnps"><Money id="bnps" value={nps} onChange={setNps} max={4} /></Row>
      <Row label="그 밖의 월 소득 (임대료 등)" htmlFor="betc"><Money id="betc" value={etc} onChange={setEtc} max={4} /></Row>
      <Row label="집·땅 (공시가격)" htmlFor="bhome"><Money id="bhome" value={home} onChange={setHome} max={6} /></Row>
      <Row label="예금·주식 등" htmlFor="bfin"><Money id="bfin" value={fin} onChange={setFin} max={6} /></Row>
      <Row label="대출 (빚)" htmlFor="bdebt"><Money id="bdebt" value={debt} onChange={setDebt} max={6} /></Row>
      <div className="gcalc-res" aria-live="polite">
        {!touched ? <>소득과 재산을 넣으면 받을 수 있는지, 대략 얼마인지 계산해 드려요. {hh === 'single' ? '혼자 받으면' : '부부가 함께 받으면 둘이 합쳐'} 최대 <b>월 {won(full)}</b>이에요.</>
          : ok ? <>소득인정액이 약 <b>월 {won(income)}</b>으로, 기준(월 {won(limit)}) 이하라 <b>받을 수 있어요.</b> 예상 금액은 {hh === 'couple' ? '부부 합쳐 ' : ''}<b>월 {won(pay)}</b>이에요.{pay < full && <> 소득인정액이 기준에 가까워 조금 줄었어요.</>}</>
          : <>소득인정액이 약 <b>월 {won(income)}</b>으로, 기준(월 {won(limit)})보다 <b>{won(income - limit)}</b> 많아요. 계산상으로는 받기 어려워요.</>}
        {touched && num(nps) * M > NPS_LINE && <small className="cwarn">국민연금이 월 {won(NPS_LINE)}보다 많으면 기초연금이 최대 절반까지 줄 수 있어요.</small>}
      </div>
      <p className="gsmall">일한 소득은 월 116만원을 빼고 30%를 더 빼서 계산해요. 집은 사는 곳에 따라 {won(HOME_DED[area])}, 예금은 2,000만원까지 빼고 남은 재산의 연 4%를 소득으로 봐요. 4,000만원이 넘는 자동차, 회원권 등은 따로 계산돼서 결과가 달라질 수 있어요.</p>
      <a className="gcta" href="/?tab=my">부모님 조건으로 받을 수 있는 혜택 더 찾기 →</a>
    </div>
  );
}
