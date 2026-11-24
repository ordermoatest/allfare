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
  // 고른 분야가 화면 밖(오른쪽 › 버튼 뒤)에 가려지지 않게 보이는 곳으로 스크롤
  useEffect(() => {
    const el = ref.current;
    const on = el?.querySelector<HTMLElement>('.chip.on');
    if (!el || !on) return;
    const pad = 56; // › 버튼 + 그라데이션 폭
    const l = on.offsetLeft - el.offsetLeft, r = l + on.offsetWidth;
    if (r > el.scrollLeft + el.clientWidth - pad) el.scrollTo({ left: r - el.clientWidth + pad, behavior: 'smooth' });
    else if (l < el.scrollLeft) el.scrollTo({ left: Math.max(0, l - 8), behavior: 'smooth' });
  }, [current]);
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
