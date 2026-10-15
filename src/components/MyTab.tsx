'use client';
import { ReactNode, useEffect, useState } from 'react';
import Footer from './Footer';
import Brand from './Brand';
import { IcSearch } from './icons';
import { INC, Profile, TAGS, bracketOf, fmtYmd, incomePercent, kidAge, kidAges, manAge, medianOf, parseYmd, regionLabel, yearsSince } from '@/lib/profile';
import { SGG, SIDO_LIST } from '@/lib/regions';
import { track } from '@/lib/client';

export const FS = [100, 115, 130];

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="pseg" role="group" aria-label={label}>
      {options.map(([v, t]) => <button key={v} className={value === v ? 'on' : ''} aria-pressed={value === v} onClick={() => onChange(value === v ? ('' as T) : v)}>{t}</button>)}
    </div>
  );
}

/** 한 줄 한 항목: 왼쪽 이름, 오른쪽 입력 */
function Row({ label, htmlFor, need, children }: { label: string; htmlFor?: string; need?: boolean; children: ReactNode }) {
  return (
    <div className="prow">
      {htmlFor ? <label htmlFor={htmlFor}>{label}{need && <i className="need">필수</i>}</label> : <span className="pl">{label}{need && <i className="need">필수</i>}</span>}
      <div className="pc">{children}</div>
    </div>
  );
}

function Sec({ n, title, sub, children }: { n: number; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="psec" aria-label={title}>
      <div className="psh"><i>{n}</i>{title}{sub && <span>{sub}</span>}</div>
      {children}
    </section>
  );
}

/** 8자리 날짜 입력 (화면에는 1988-05-23 모양) */
function DateInput({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (digits: string) => void; placeholder: string }) {
  return (
    <input id={id} className="pdate" inputMode="numeric" autoComplete="off" placeholder={placeholder} value={fmtYmd(value)} maxLength={10}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 8))} />
  );
}

export default function MyTab({ profile, fs, setFs, onSave, onReset, onHome }: {
  profile: Profile; fs: number; setFs: (n: number) => void;
  onSave: (p: Profile) => void; onReset: () => void; onHome: () => void;
}) {
  const [d, setD] = useState<Profile>(profile);
  const [err, setErr] = useState('');
  const [armed, setArmed] = useState(false);
  const [pickInc, setPickInc] = useState(false);
  useEffect(() => { setD(profile); }, [profile]);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);

  const age = manAge(d.birth);
  const pct = incomePercent(d);
  const sggs = d.sido ? SGG[d.sido] : [];
  const ages = kidAges(d);
  const myrs = yearsSince(d.marryDate);

  // 가구원 수는 본인 + 배우자 + 자녀 수보다 작아지지 않게
  const minHh = (p: Profile) => 1 + (p.marry === 'M' ? 1 : 0) + (p.hasKids === 'Y' ? p.kids.length : 0);
  const set = (p: Partial<Profile>) => {
    setD((x) => {
      const n = { ...x, ...p };
      const m = minHh(n);
      if (n.hh < m) {
        n.hh = Math.min(10, m);
        const q = incomePercent(n);
        if (q !== null) n.inc = bracketOf(q);
      }
      return n;
    });
    setErr('');
  };

  const setIncome = (mi: string, hh = d.hh) => {
    const p = incomePercent({ mi, hh });
    set({ mi, hh, ...(p !== null ? { inc: bracketOf(p) } : {}) });
  };

  const toggleTag = (t: string) => {
    if (t === '해당 없음') { set({ tags: d.tags.includes(t) ? [] : [t] }); return; }
    const without = d.tags.filter((x) => x !== '해당 없음');
    set({ tags: without.includes(t) ? without.filter((x) => x !== t) : [...without, t] });
  };

  const setKid = (i: number, v: string) => set({ kids: d.kids.map((k, j) => (j === i ? v : k)) });

  const apply = () => {
    if (age === null) { setErr('생년월일 8자리를 입력해 주세요. 예시: 19880523'); document.getElementById('birth')?.focus(); return; }
    if (!d.sido) { setErr('사는 곳(시·도)을 선택해 주세요'); document.getElementById('sido')?.focus(); return; }
    if (sggs.length && !d.sgg) { setErr('시·군·구를 선택해 주세요'); document.getElementById('sgg')?.focus(); return; }
    if (d.marry === 'M' && d.marryDate && !parseYmd(d.marryDate)) { setErr('혼인신고일을 확인해 주세요. 예시: 20210612'); document.getElementById('mdate')?.focus(); return; }
    if (d.hasKids === 'Y') {
      if (!d.kids.length) { setErr("자녀 생년월일을 넣거나 자녀 '없음'을 골라주세요"); return; }
      const bad = d.kids.findIndex((k) => kidAge(k) === null);
      if (bad >= 0) { setErr(`${bad + 1}번째 자녀 생년월일을 확인해 주세요. 예시: 20190315`); document.getElementById(`kid${bad}`)?.focus(); return; }
    }
    onSave({ ...d, kids: d.hasKids === 'Y' ? d.kids : [], marryDate: d.marry === 'M' ? d.marryDate : '', set: true });
    track('save_profile', { sido: d.sido, sgg: d.sgg, age_group: Math.floor(age / 10) * 10, inc: d.inc || '미입력', kids: ages.length, head: d.head || '모름', marry: d.marry || '모름' });
  };

  const reset = () => { if (!armed) { setArmed(true); return; } setArmed(false); onReset(); };
  const savedAge = manAge(profile.birth);

  return (
    <>
      <div className="head"><Brand onClick={onHome} /></div>
      <div className="head">
        <div><h2 className="tabtitle">내 조건</h2><div className="cap">로그인 없이 이 기기에만 저장돼요</div></div>
        <div className="zoomctl" role="group" aria-label="글자 크기">
          <button aria-label="글자 작게" onClick={() => setFs(Math.max(0, fs - 1))}>−</button>
          <span className="zi"><IcSearch /><small>{FS[fs]}%</small></span>
          <button aria-label="글자 크게" onClick={() => setFs(Math.min(FS.length - 1, fs + 1))}>+</button>
        </div>
      </div>

      {profile.set && (
        <section className="saved">
          <strong>이 기기에 저장된 내 정보</strong>
          <p>{[savedAge !== null ? `만 ${savedAge}세` : null, regionLabel(profile), `${profile.hh}인 가구`, profile.inc ? `중위 ${profile.inc}` : null, kidAges(profile).length ? `자녀 ${kidAges(profile).length}명` : null].filter(Boolean).join(' · ')}</p>
        </section>
      )}

      <Sec n={1} title="기본 정보">
        <Row label="생년월일" htmlFor="birth" need>
          <DateInput id="birth" value={d.birth} placeholder="예시: 19880523" onChange={(v) => { set({ birth: v }); if (v.length === 8 && manAge(v) === null) setErr('날짜를 다시 확인해 주세요. 예시: 19880523'); }} />
          <span className="pbadge2" aria-live="polite">{age === null ? '만 --세' : `만 ${age}세`}</span>
        </Row>
        <Row label="사는 곳" need>
          <select id="sido" aria-label="시·도" value={d.sido} onChange={(e) => set({ sido: e.target.value, sgg: '' })}>
            <option value="">시·도</option>
            {SIDO_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select id="sgg" aria-label="시·군·구" value={d.sgg} disabled={!d.sido || !sggs.length} onChange={(e) => set({ sgg: e.target.value })}>
            <option value="">{!d.sido ? '시·군·구' : sggs.length ? '시·군·구' : '없음'}</option>
            {sggs.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Row>
        <p className="pnote">사는 곳은 주민등록등본 주소 기준이에요</p>
        <Row label="성별"><Seg label="성별" value={d.gender} options={[['M', '남성'], ['F', '여성']]} onChange={(v) => set({ gender: v })} /></Row>
      </Sec>

      <Sec n={2} title="가구·소득" sub="선택">
        <Row label="세대주"><Seg label="세대주 여부" value={d.head} options={[['Y', '세대주'], ['N', '세대원']]} onChange={(v) => set({ head: v })} /></Row>
        <Row label="혼인">
          <Seg label="혼인 여부" value={d.marry} options={[['S', '미혼'], ['P', '결혼 예정'], ['M', '기혼']]} onChange={(v) => set({ marry: v })} />
        </Row>
        {d.marry === 'M' && (
          <Row label="혼인신고일" htmlFor="mdate">
            <DateInput id="mdate" value={d.marryDate} placeholder="예시: 20210612" onChange={(v) => set({ marryDate: v })} />
            <span className="pbadge2">{myrs === null ? '--년차' : `${myrs + 1}년차`}</span>
          </Row>
        )}
        <Row label="가구원 수">
          <div className="step">
            <button aria-label="가구원 줄이기" onClick={() => setIncome(d.mi, Math.max(minHh(d), d.hh - 1))}>−</button>
            <b>{d.hh}명</b>
            <button aria-label="가구원 늘리기" onClick={() => setIncome(d.mi, Math.min(10, d.hh + 1))}>+</button>
          </div>
        </Row>
        <Row label="월 소득" htmlFor="mi">
          <div className="money"><input id="mi" inputMode="numeric" placeholder="예시: 274" value={d.mi} onChange={(e) => setIncome(e.target.value.replace(/\D/g, '').slice(0, 5))} /><span>만원</span></div>
        </Row>
        <div className="pres" aria-live="polite">
          {pct !== null
            ? <>가구 합계 세전 기준 · 중위소득 약 <b>{pct}%</b> → <b>{bracketOf(pct)}</b></>
            : d.inc && !d.mi ? <>소득 구간 <b>{d.inc}</b></>
            : <>{d.hh}인 가구 중위소득은 월 {Math.round(medianOf(d.hh) / 10000).toLocaleString()}만원이에요</>}
          <span className="plinks">
          <a className="plink" href="/guide/median-income">중위소득이 뭔가요?</a>
          <button className="plink" aria-expanded={pickInc} onClick={() => setPickInc(!pickInc)}>{pickInc ? '접기' : '직접 고르기'}</button>
          </span>
        </div>
        {pickInc && (
          <div className="grid3" style={{ paddingBottom: 6 }}>
            {INC.map((i) => <button key={i} className={`opt ${d.inc === i ? 'on' : ''}`} aria-pressed={d.inc === i} onClick={() => set({ inc: i, mi: '' })}>{i}</button>)}
          </div>
        )}
      </Sec>

      <Sec n={3} title="자녀·임신" sub="선택">
        <Row label="자녀"><Seg label="자녀 여부" value={d.hasKids} options={[['N', '없음'], ['Y', '있음']]} onChange={(v) => set({ hasKids: v, kids: v === 'Y' && !d.kids.length ? [''] : d.kids })} /></Row>
        {d.hasKids === 'Y' && (
          <div className="kids">
            {d.kids.map((k, i) => {
              const a = kidAge(k);
              return (
                <div key={i} className="kidrow">
                  <label htmlFor={`kid${i}`} className="kidno">{i + 1}번째</label>
                  <DateInput id={`kid${i}`} value={k} placeholder="예시: 20190315" onChange={(v) => setKid(i, v)} />
                  <span className="pbadge2">{a === null ? '--' : `만 ${a}세`}</span>
                  <button className="kidx" aria-label={`${i + 1}번째 자녀 지우기`} onClick={() => set({ kids: d.kids.filter((_, j) => j !== i) })}>✕</button>
                </div>
              );
            })}
            {d.kids.length < 8 && <button className="plink" style={{ alignSelf: 'flex-start' }} onClick={() => set({ kids: [...d.kids, ''] })}>+ 자녀 추가</button>}
          </div>
        )}
        <Row label="가족 중 임신">
          <Seg label="가족 중 임신 (본인 또는 배우자)" value={d.pregnant} options={[['N', '아니요'], ['Y', '예']]} onChange={(v) => set({ pregnant: v })} />
        </Row>
        <p className="pnote">본인 또는 배우자가 임신 중이면 &lsquo;예&rsquo;를 골라주세요</p>
      </Sec>

      <Sec n={4} title="그 밖에 해당하는 것" sub="중복 선택 가능">
        <div className="wrap" style={{ padding: '6px 0 4px' }}>
          {TAGS.map((t) => (
            <button key={t.label} className={`tg ${d.tags.includes(t.label) ? 'on' : ''}`}
              aria-pressed={d.tags.includes(t.label)} onClick={() => toggleTag(t.label)}>{t.label}</button>
          ))}
        </div>
        <p className="pnote">&lsquo;해당 없음&rsquo;을 고르면 이 항목이 필요한 혜택은 &lsquo;안 맞음&rsquo;으로 분류돼요</p>
      </Sec>

      <span className="err" role="alert">{err}</span>
      <button className="cta" onClick={apply}>이 조건으로 혜택 보기</button>
      {profile.set && (
        <button className={`resetbtn ${armed ? 'armed' : ''}`} onClick={reset}>{armed ? '한 번 더 누르면 저장된 내 정보가 지워져요' : '내 정보 초기화'}</button>
      )}
      <Footer />
    </>
  );
}
