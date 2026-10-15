// 복지 소식 (매주 월요일 발행 — 맨 위가 최신)
// 새 글은 NEWS 배열 맨 앞에 추가하면 목록·사이트맵·RSS·메인 인기 소식에 자동 반영돼요.
// kind: weekly = 이번 주 정리글 / theme = 한 주제를 깊게 다루는 테마글
import type { ReactNode } from 'react';

export type News = {
  slug: string; kind: 'weekly' | 'theme'; date: string; emoji: string;
  title: string; seoTitle: string; sub?: string; desc: string; kw?: string[];
  body: ReactNode;
};

const Tip = ({ children }: { children: ReactNode }) => <div className="gtip">💡 {children}</div>;
const Check = ({ children }: { children: ReactNode }) => <div className="gcheck">✅ {children}</div>;
const Item = ({ tag, title, href, children }: { tag?: string; title: string; href?: string; children: ReactNode }) => (
  <div className="nitem">
    <b>{tag && <span className="ntag">{tag}</span>}{href ? <a href={href}>{title} ›</a> : title}</b>
    <p>{children}</p>
  </div>
);

export const NEWS: News[] = [
  {
    slug: '2026-10-3',
    kind: 'weekly',
    date: '2026-10-16',
    emoji: '📰',
    title: '10월 셋째 주 복지 소식',
    sub: '문화누리카드 마감 D-45 · 내년 생계급여 인상 · 신청 없이 받는 아동수당',
    seoTitle: '10월 셋째 주 복지 소식: 문화누리카드 마감, 2027 기준중위소득 6.7% 인상, 아동수당 자동지급',
    desc: '문화누리카드 신청 마감(11월 30일)과 근로장려금 기한 후 신청, 2027년 기준중위소득 6.7% 인상과 생계급여, 신청하지 않아도 받는 아동수당·부모급여 소식을 한 번에 정리했어요.',
    kw: ['복지 소식', '문화누리카드 마감', '2027 기준중위소득', '2027 생계급여', '아동수당 자동지급', '신청주의 개선'],
    body: (
      <>
        <p>이번 주에 챙기면 좋은 복지 소식을 모았어요. 마감이 다가오는 혜택부터, 내년에 달라지는 제도까지 한 번에 확인해 보세요.</p>

        <h2>⏰ 마감이 다가와요</h2>
        <Item tag="D-45" title="문화누리카드 신청 마감 (11월 30일)" href="/guide/culture-nuri-card">
          올해 문화누리카드(1인 15만원, 일부 연령 16만원)는 <b>11월 30일까지</b> 신청할 수 있어요. 받은 금액은 <b>12월 31일까지</b> 써야 하고, 남은 돈은 내년으로 넘어가지 않아요.
        </Item>
        <Item tag="D-46" title="근로·자녀장려금 기한 후 신청 (12월 1일)" href="/guide/work-incentive">
          5월 정기 신청을 놓쳤다면 <b>12월 1일까지</b> 홈택스·손택스에서 신청할 수 있어요. 대신 금액의 95%를 받아요.
        </Item>
        <Item tag="D-76" title="에너지바우처 신청 마감 (12월 31일)" href="/guide/energy-voucher">
          겨울 난방비를 지원하는 에너지바우처는 <b>12월 31일까지</b> 신청할 수 있어요. 4인 이상 가구는 1년에 최대 70만 1,300원이에요.
        </Item>

        <h2>🆕 이번 달 시작됐어요</h2>
        <Item title="에너지바우처 겨울철 사용 시작" href="/guide/energy-voucher">
          10월부터 겨울철 사용이 시작됐어요. 요금 차감 방식은 고지서에서 자동으로 빠지고, 국민행복카드 방식은 연탄·등유·LPG를 살 때 카드로 결제하면 돼요.
        </Item>
        <Item title="청년미래적금 2차 모집 예고 (12월)" href="/guide/youth-future-savings">
          정부가 납입액의 6%(우대형 12%)를 더 넣어주는 청년미래적금의 다음 모집이 <b>12월로 예정</b>돼 있어요. 만 19~34세라면 미리 조건을 확인해 두세요.
        </Item>

        <h2>🔄 이렇게 달라져요</h2>
        <Item title="내년 기준중위소득 6.7% 인상, 생계급여도 올라요" href="/guide/median-income">
          2027년 기준중위소득이 역대 가장 큰 폭인 <b>6.7%</b> 올라요. 1인 가구는 월 273만 6,042원, 4인 가구는 월 692만 9,885원이에요. 생계급여 최대 금액도 1인 가구 월 87만 5,533원, 4인 가구 월 221만 7,563원으로 올라요. 기준이 오르면 올해는 대상이 아니던 집도 내년엔 받을 수 있어요.
        </Item>
        <Item title="아동수당·부모급여, 이제 신청 안 해도 받아요">
          &lsquo;신청주의 개선&rsquo; 법이 국회를 통과했어요. 앞으로는 <b>아동수당·부모급여·첫만남이용권</b>을 따로 신청하지 않아도 지급되고, 아동수당과 부모급여는 <b>태어난 달부터</b> 받게 돼요. 법이 공포된 뒤 3개월이 지나면 시행되니, <b>그 전까지는 지금처럼 신청</b>해야 해요.
        </Item>
        <Check>장애인연금을 받던 분이 만 65세가 되면 기초연금도 신청한 것으로 보고 심사하는 내용도 함께 들어갔어요.</Check>

        <h2>👍 이번 주 추천 혜택</h2>
        <Item tag="교통비" title="K-패스·모두의 카드" href="/guide/k-pass">
          대중교통을 한 달에 15번 이상 탄다면 쓴 돈의 20~53%를 돌려받아요. 많이 타는 달에는 기준금액을 넘은 금액을 전부 돌려받는 모두의 카드가 자동으로 적용돼요.
        </Item>
        <Item tag="노후" title="기초연금" href="/guide/basic-pension">
          올해 선정 기준이 단독 가구 월 247만원으로 올랐어요. 예전에 떨어졌던 부모님도 다시 신청해 볼 만해요.
        </Item>
        <Item tag="청년" title="청년월세 지원" href="/guide/youth-rent">
          올해부터 매년 모집하는 상시 사업이 됐어요. 내년 봄 모집에 맞춰 임대차계약서와 월세 이체 내역을 미리 챙겨두세요.
        </Item>

        <Tip>내 나이·사는 곳·소득을 넣으면 받을 수 있는 혜택만 골라드려요. 아래 버튼을 눌러 확인해 보세요.</Tip>
        <p className="gsmall">2026년 10월 16일 기준이에요. 보건복지부·국세청·한국에너지공단 발표와 언론 보도를 바탕으로 정리했어요. 신청 전 공식 안내를 꼭 확인하세요.</p>
      </>
    ),
  },
];

export const newsBySlug = (slug: string) => NEWS.find((n) => n.slug === slug);
export const fmtNewsDate = (d: string) => { const [y, m, dd] = d.split('-').map(Number); return `${y}년 ${m}월 ${dd}일`; };
