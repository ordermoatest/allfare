'use client';
import { useState } from 'react';
import { shareLink, track } from '@/lib/client';
import { IcShare } from './icons';

/** 가이드·지역 페이지 공유 버튼 (폰: 공유창 / PC: 링크 복사) */
export default function ShareButton({ title, text, from, big, label }: { title: string; text: string; from: string; big?: boolean; label?: string }) {
  const [msg, setMsg] = useState('');
  const go = async () => {
    const url = location.origin + location.pathname;
    const r = await shareLink(title, text, url);
    track('share_page', { from, via: r });
    if (r === 'copied') setMsg('링크를 복사했어요. 원하는 곳에 붙여넣어 보내세요');
    else if (r === 'fail') setMsg('공유하지 못했어요');
    else return;
    setTimeout(() => setMsg(''), 2600);
  };
  return (
    <>
      <button type="button" className={big ? 'pshare big' : 'pshare'} onClick={go}>
        <IcShare size={big ? 18 : 15} />{label || (big ? '이 글 공유하기' : '공유')}
      </button>
      {msg && <div className="toast" role="status">{msg}</div>}
    </>
  );
}
