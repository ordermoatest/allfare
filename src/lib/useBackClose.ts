'use client';
import { useEffect, useRef } from 'react';

/**
 * 창(시트)이 열려 있을 때 폰 뒤로가기를 누르면 페이지 이동 대신 창만 닫기.
 * 열 때 방문 기록을 하나 쌓고, 버튼으로 닫으면 그 기록을 되돌림.
 * (창을 열고 닫는 부모 컴포넌트에서 사용)
 */
export function useBackClose(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  const pushed = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (!pushed.current) {
      history.pushState({ ...(history.state || {}), afSheet: true }, '');
      pushed.current = true;
    }
    const onPop = () => { pushed.current = false; closeRef.current(); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [open]);

  useEffect(() => {
    if (!open && pushed.current) { pushed.current = false; history.back(); }
  }, [open]);
}
