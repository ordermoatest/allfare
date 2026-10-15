export default function Footer({ notes }: { notes?: string[] }) {
  const mail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const lines = [
    ...(notes || []),
    '올페어는 정부 기관이 아니며, 공공데이터포털 자료를 바탕으로 안내해요.',
  ];
  return (
    <section className="foot">
      <ul className="footnotes">{lines.map((t) => <li key={t}><b aria-hidden>ⓘ</b><span>{t}</span></li>)}</ul>
      <p><a href="/guide">복지 가이드</a> · <a href="/about">올페어 소개</a> · <a href="/privacy">개인정보처리방침</a> · <a href="/terms">이용약관</a>{mail ? <> · 문의 <span className="sel">{mail}</span></> : null}</p>
    </section>
  );
}
