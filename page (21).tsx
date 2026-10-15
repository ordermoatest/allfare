import type { Metadata } from 'next';
import Brand from '@/components/Brand';

export const metadata: Metadata = {
  title: '올페어 소개 - 내 복지 혜택 · 문화누리카드 사용처 찾기',
  description: '올페어는 정부·지자체 복지 혜택 중 내 조건에 맞는 것을 골라주고, 내 주변 문화누리카드 사용처를 지도로 보여주는 무료 조회 서비스예요.',
  alternates: { canonical: '/about' },
};

export default function About() {
  const mail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <main className="doc">
      <Brand href="/" />
      <h1 style={{ marginTop: 20 }}>올페어 소개</h1>
      <p>올페어(All welFare)는 &lsquo;모두의 복지&rsquo;라는 뜻이에요. 받을 수 있는 혜택이 있어도 몰라서 놓치는 일이 없도록, 흩어져 있는 복지 정보를 한곳에서 쉽게 찾아볼 수 있게 만들었어요.</p>

      <h2>무엇을 할 수 있나요</h2>
      <ul>
        <li><b>내 조건에 맞는 혜택 찾기</b> — 생년월일, 사는 곳, 소득, 자녀 등을 넣으면 1만여 개의 정부·지자체 혜택을 &lsquo;꼭 맞음 · 확인 필요 · 누구나 · 안 맞음&rsquo;으로 나눠 보여드려요. 안 맞는 혜택은 어떤 조건이 다른지도 알려드려요.</li>
        <li><b>문화누리카드 사용처 찾기</b> — 내 주변 문화누리카드 가맹점을 지도와 목록으로 보여드리고, 실제 이용자가 남긴 결제 가능 여부와 후기를 함께 볼 수 있어요.</li>
      </ul>

      <h2>개인정보 걱정 없이</h2>
      <p>로그인이 필요 없고, 입력한 조건은 내 휴대폰·PC 브라우저에만 저장돼요. 서버로 보내지 않아요.</p>

      <h2>정보는 어디서 오나요</h2>
      <ul>
        <li>복지 혜택: 공공데이터포털 &lsquo;행정안전부 대한민국 공공서비스(혜택) 정보&rsquo; (매일 새벽 갱신)</li>
        <li>문화누리카드 가맹점: 공공데이터포털 &lsquo;한국문화예술위원회 문화누리카드 가맹점 목록&rsquo;</li>
        <li>지도·위치: 카카오맵</li>
      </ul>
      <p>올페어는 정부 기관이 아니며 혜택 신청을 대행하지 않아요. 실제 선정 여부는 신청처에서 꼭 확인하세요.</p>

      <h2>운영</h2>
      <p>운영: AllFare{mail ? <><br />문의: <span className="sel">{mail}</span></> : null}</p>
      <p><a href="/">← 올페어에서 내 혜택 찾아보기</a></p>
    </main>
  );
}
