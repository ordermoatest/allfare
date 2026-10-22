'use client';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { IcChevron } from './icons';

// 상단에 붙는 분야 배지 줄 (옆으로 넘기기 + › 버튼)
export default function CatBar({ title, right, items, current, onPick, label }: {
  title?: ReactNode; right?: ReactNode; label: string;
  items: { key: string; count: number }[]; current: string; onPick: (k: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [end, setEnd] = useState(false);
  const update = () => { const el = ref.current; if (el) setEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4); };
  useEffect(() => { update(); }, [items.length]);
  return (
    <div className="catbar">
      {(title || right) && (
        <div className="row" style={{ padding: '0 4px' }}>
          <strong style={{ fontSize: 15 }}>{title}</strong>
          {right}
        </div>
      )}
      <div className={`catwrap ${end ? 'end' : ''}`}>
        <button className="more" aria-label="분야 더 보기" onClick={() => ref.current?.scrollBy({ left: ref.current.clientWidth * 0.7, behavior: 'smooth' })}><IcChevron /></button>
        <div className="chips" ref={ref} onScroll={update} role="tablist" aria-label={label}>
          {items.map((it) => (
            <button key={it.key} role="tab" aria-selected={current === it.key} className={`chip ${current === it.key ? 'on' : ''}`} onClick={() => onPick(it.key)}>
              {it.key}<span className="cnt">{it.count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
