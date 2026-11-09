'use client';
import type { ReactNode } from 'react';

// 계산기 공통 입력 부품
export function Seg<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: [T, string][]; label: string }) {
  return (
    <div className="cseg" role="radiogroup" aria-label={label}>
      {options.map(([v, t]) => <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{t}</button>)}
    </div>
  );
}
export function Money({ id, value, onChange, placeholder, unit = '만원', max = 6 }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; unit?: string; max?: number }) {
  return <div className="money"><input id={id} inputMode="numeric" placeholder={placeholder || '0'} value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, max))} /><span>{unit}</span></div>;
}
export function Row({ label, htmlFor, children, col }: { label: ReactNode; htmlFor?: string; children: ReactNode; col?: boolean }) {
  return <div className={`gcalc-row${col ? ' col' : ''}`}>{htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span>{label}</span>}{children}</div>;
}
export function Step({ value, set, min, max, unit, label }: { value: number; set: (n: number) => void; min: number; max: number; unit: string; label: string }) {
  return (
    <div className="step">
      <button type="button" aria-label={`${label} 줄이기`} onClick={() => set(Math.max(min, value - 1))}>−</button>
      <b>{value}{unit}</b>
      <button type="button" aria-label={`${label} 늘리기`} onClick={() => set(Math.min(max, value + 1))}>+</button>
    </div>
  );
}
/** 원 → "34만 9,700원" 같은 읽기 쉬운 금액 (100원 단위) */
export function won(w: number): string {
  const v = Math.max(0, Math.round(w / 100) * 100);
  const man = Math.floor(v / 10000), rest = v % 10000;
  if (!man) return `${rest.toLocaleString()}원`;
  return `${man.toLocaleString()}만${rest ? ` ${rest.toLocaleString()}` : ''}원`;
}
export const num = (s: string) => parseInt(s || '0', 10) || 0;
