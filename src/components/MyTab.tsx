'use client';
import { useEffect, useState } from 'react';
import Footer from './Footer';
import { IcSearch } from './icons';
import { INC, Profile, TAGS, bracketOf, incomePercent, manAge, medianOf, regionLabel } from '@/lib/profile';
import { SGG, SIDO_LIST } from '@/lib/regions';
import { track } from '@/lib/client';

export const FS = [100, 115, 130];

export default function MyTab({ profile, fs, setFs, onSave, onReset }: {
  profile: Profile; fs: number; setFs: (n: number) => void;
  onSave: (p: Profile) => void; onReset: () => void;
}) {
  const [d, setD] = useState<Profile>(profile);
  const [err, setErr] = useState('');
  const [armed, setArmed] = useState(false);
  useEffect(() => { setD(profile); }, [profile]);

  const age = manAge(d.birth);
  const pct = incomePercent(d);
  const set = (p: Partial<Profile>) => { setD((x) => ({ ...x, ...p })); setErr(''); };
  const sggs = d.sido ? SGG[d.sido] : [];

  const setIncome = (mi: string, hh = d.hh) => {
    const p = incomePercent({ mi, hh });
    set({ mi, hh, ...(p !== null ? { inc: bracketOf(p) } : {}) });
  };

  const toggleTag = (t: string) => {
    if (t === '해당 없음') { set({ tags: d.tags.includes(t) ? [] : [t] }); return; }
    const without = d.tags.filter((x) => x !== '해당 없음');
    set({ tags: without.includes(t) ? without.filter((x) => x !== t) : [...without, t] });
  };

  const apply = () => {
    if (age === null) { setErr('주민등록번호 앞 6자리를 입력해 주세요. 예시: 900215'); document.getElementById('birth')?.focus(); return; }
    if (!d.sido) { setErr('사는 곳(시·도)을 선택해 주세요'); document.getElementById('sido')?.focus(); return; }
    if (sggs.length && !d.sgg) { setErr('시·군·구를 선택해 주세요'); document.getElementById('sgg')?.focus(); return; }
    onSave({ ...d, set: true });
    track('save_profile', { sido: d.sido, sgg: d.sgg, age_group: Math.floor(age / 10) * 10, inc: d.inc || '미입력' });
  };

  return (
    <>
      <div className="head">
        <div><h1>내 조건</h1><div className="cap">로그인 없이 이 기기에만 저장돼요</div></div>
        <div className="zoomctl" role="group" aria-label="글자 크기">
          <button aria-label="글자 작게" onClick={() => setFs(Math.max(0, fs - 1))}>−</button>
          <span className="zi"><IcSearch /><small>{FS[fs]}%</small></span>
          <button aria-label="글자 크게" onClick={() => setFs(Math.min(FS.length - 1, fs + 1))}>+</button>
        </div>
      </div>

      {profile.set && (
        <section className="saved">
          <div className="row"><strong>이 기기에 저장된 내 정보</strong>
            <button className="linkbtn" style={{ minHeight: 32 }} onClick={() => { if (!armed) { setArmed(true); return; } setArmed(false); onReset(); }}>{armed ? '한 번 더 누르면 지워져요' : '초기화'}</button>
          </div>
          <p>{[manAge(profile.birth) !== null ? `만 ${manAge(profile.birth)}세` : null, regionLabel(profile), `${profile.hh}인 가구`, profile.inc ? `중위 ${profile.inc}` : null].filter(Boolean).join(' · ')}</p>
          <span className="cap">같은 휴대폰·같은 브라우저에서 다시 열면 그대로 보여요</span>
        </section>
      )}

      <section className="panel">
        <div className="field">
          <label htmlFor="birth">주민등록번호 앞 6자리 <span className="light">(YYMMDD)</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="birth" inputMode="numeric" maxLength={6} placeholder="예시: YYMMDD (900215)" value={d.birth} autoComplete="off"
              onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); set({ birth: v }); if (v.length === 6 && manAge(v) === null) setErr('날짜를 다시 확인해 주세요. 예시: 900215'); }}
              style={{ flex: 1 }} />
            <span className="agebadge" aria-live="polite">{age === null ? '만 --세' : `만 ${age}세`}</span>
          </div>
        </div>

        <div className="field">
          <span>사는 곳 <span className="light">(주민등록상 주소지)</span></span>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: 8 }}>
            <select id="sido" aria-label="시·도" value={d.sido} onChange={(e) => set({ sido: e.target.value, sgg: '' })}>
              <option value="">시·도</option>
              {SIDO_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select id="sgg" aria-label="시·군·구" value={d.sgg} disabled={!d.sido || !sggs.length} onChange={(e) => set({ sgg: e.target.value })}>
              <option value="">{!d.sido ? '시·도 먼저' : sggs.length ? '시·군·구' : '해당 없음'}</option>
              {sggs.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <span className="cap light">지역 혜택을 고르는 데 써요. 시·군·구까지만 저장돼요</span>
        </div>

        <div className="field">가구 소득
          <div className="incbox">
            <div className="row"><span className="cap" style={{ fontWeight: 600 }}>함께 사는 가구원 (나 포함)</span>
              <div className="step">
                <button aria-label="가구원 줄이기" onClick={() => setIncome(d.mi, Math.max(1, d.hh - 1))}>−</button>
                <b>{d.hh}명</b>
                <button aria-label="가구원 늘리기" onClick={() => setIncome(d.mi, Math.min(10, d.hh + 1))}>+</button>
              </div>
            </div>
            <label className="cap" htmlFor="mi" style={{ fontWeight: 600 }}>가구 월 소득 합계 (세전)</label>
            <div className="money"><input id="mi" inputMode="numeric" placeholder="예시: 274" value={d.mi} onChange={(e) => setIncome(e.target.value.replace(/\D/g, '').slice(0, 5))} /><span>만원</span></div>
            <div className="incres" aria-live="polite">
              {pct === null
                ? <span className="cap">{d.hh}인 가구 기준 중위소득은 월 {Math.round(medianOf(d.hh) / 10000).toLocaleString()}만원이에요 (2026년)</span>
                : <><b>기준 중위소득의 약 {pct}%</b><span>→ <strong>{bracketOf(pct)}</strong> 구간으로 골랐어요</span>
                  <span className="cap">{d.hh}인 가구 100% = 월 {Math.round(medianOf(d.hh) / 10000).toLocaleString()}만원 · 재산을 포함한 실제 심사 금액과는 다를 수 있어요</span></>}
            </div>
          </div>
          <span className="cap light">또는 직접 고르기</span>
          <div className="grid3">
            {INC.map((i) => <button key={i} className={`opt ${d.inc === i ? 'on' : ''}`} aria-pressed={d.inc === i} onClick={() => set({ inc: i, mi: '' })}>{i}</button>)}
          </div>
        </div>

        <div className="field">해당하는 것 (여러 개 선택)
          <div className="wrap">
            {TAGS.map((t) => <button key={t.label} className={`tg ${d.tags.includes(t.label) ? 'on' : ''}`} aria-pressed={d.tags.includes(t.label)} onClick={() => toggleTag(t.label)}>{t.label}</button>)}
          </div>
        </div>
      </section>
      <span className="err" role="alert">{err}</span>
      <button className="cta" onClick={apply}>이 조건으로 혜택 보기</button>
      <Footer />
    </>
  );
}
