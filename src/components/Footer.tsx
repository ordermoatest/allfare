export default function Footer() {
  const mail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <section className="foot">
      <p>올페어는 정부 기관이 아니며, 공공데이터포털 자료(행정안전부 공공서비스 정보, 한국문화예술위원회 가맹점 목록)를 바탕으로 안내합니다. 정확한 내용은 신청처에서 확인하세요.</p>
      <p><a href="/privacy">개인정보처리방침</a> · <a href="/terms">이용약관</a>{mail ? <> · 문의 <span className="sel">{mail}</span></> : null}</p>
    </section>
  );
}
