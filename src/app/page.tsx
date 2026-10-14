'use client';

import React, { useState } from 'react';

interface WelfareItem {
  id: string;
  category: string;
  title: string;
  amount: string;
  eligibility: string[];
  selectionCriteria: string;
  applyUrl: string;
}

interface CultureStore {
  id: string;
  name: string;
  category: string;
  region: string;
  address: string;
  type: '오프라인' | '온라인';
}

const WELFARE_DATA: WelfareItem[] = [
  {
    id: '1',
    category: '주거·중립',
    title: '청년월세 특별지원',
    amount: '월 최대 20만원 (최대 12개월)',
    eligibility: ['만 19세 ~ 34세 무주택 청년', '청년독립가구 중위소득 60% 이하'],
    selectionCriteria: '소득 및 재산 요건 충족 시 선발',
    applyUrl: 'https://www.bokjiro.go.kr',
  },
  {
    id: '2',
    category: '보육·육아',
    title: '부모급여 지원',
    amount: '월 50만 ~ 100만원',
    eligibility: ['0~1세 아동을 양육하는 보호자', '만 0세: 월 100만원 / 만 1세: 월 50만원'],
    selectionCriteria: '연령 조건 충족 시 전원 지급',
    applyUrl: 'https://www.bokjiro.go.kr',
  },
  {
    id: '3',
    category: '교통·혜택',
    title: 'K-패스 교통비 환급',
    amount: '대중교통비 20% ~ 53% 환급',
    eligibility: ['만 19세 이상 전국 주민', '월 15회 이상 대중교통 이용자'],
    selectionCriteria: '이용 횟수 및 계층별(청년/저소득) 환급율 적용',
    applyUrl: 'https://korea-pass.kr',
  },
  {
    id: '4',
    category: '문화·체육',
    title: '문화누리카드 지원',
    amount: '연 13만원 지원',
    eligibility: ['기초생활수급자 및 차상위계층 (만 6세 이상)'],
    selectionCriteria: '대상자 요건 확인 후 바로 발급',
    applyUrl: 'https://www.mnuri.kr',
  },
  {
    id: '5',
    category: '주거·중립',
    title: '청년 전월세보증금 대출지원',
    amount: '최대 2억원 (연 1.5%~2.1% 저금리)',
    eligibility: ['만 19세 ~ 34세 무주택 세대주', '부부합산 연소득 5천만원 이하'],
    selectionCriteria: '소득 및 자산 심사 후 한도 결정',
    applyUrl: 'https://nhuf.molit.go.kr',
  },
  {
    id: '6',
    category: '보육·육아',
    title: '아동수당 지급',
    amount: '월 10만원 (만 8세 미만)',
    eligibility: ['대한민국 국적을 보유한 만 8세 미만 모든 아동'],
    selectionCriteria: '소득·재산 상관없이 대상 아동 전원 지급',
    applyUrl: 'https://www.bokjiro.go.kr',
  },
  {
    id: '7',
    category: '교통·혜택',
    title: '기후동행카드 (서울시)',
    amount: '월 6만 2천원 ~ 6만 5천원 (무제한 이용)',
    eligibility: ['서울시 및 수도권 대중교통 이용자', '청년 할인(만 19~39세) 적용 시 5만원대'],
    selectionCriteria: '실물카드 또는 모바일 앱 등록 후 바로 적용',
    applyUrl: 'https://topis.seoul.go.kr',
  },
  {
    id: '8',
    category: '문화·체육',
    title: '청년문화예술패스',
    amount: '연 최대 15만원 (공연·전시 관람비)',
    eligibility: ['만 19세 청년 (2005년생 기준)'],
    selectionCriteria: '발급 신청자 선착순 순차 지급',
    applyUrl: 'https://www.munhwa.go.kr',
  },
  {
    id: '9',
    category: '주거·중립',
    title: '버팀목 전세자금대출',
    amount: '최대 1.2억원~2.2억원 지원',
    eligibility: ['무주택 세대주', '부부합산 연소득 5천만원 이하'],
    selectionCriteria: '주택도시기금 소득 및 자산 기준 산정',
    applyUrl: 'https://nhuf.molit.go.kr',
  },
  {
    id: '10',
    category: '보육·육아',
    title: '첫만남이용권 (첫째아/둘째아)',
    amount: '첫째아 200만원 / 둘째아 이상 300만원',
    eligibility: ['출생 신고되어 주민등록번호를 부여받은 아동'],
    selectionCriteria: '국민행복카드 바우처 포인트로 즉시 지급',
    applyUrl: 'https://www.bokjiro.go.kr',
  },
  {
    id: '11',
    category: '교통·혜택',
    title: '어르신 교통비 지원 (지하철 무상)',
    amount: '전국 지하철 무료 이용',
    eligibility: ['만 65세 이상 대한민국 어르신'],
    selectionCriteria: '주민센터 방문 후 우대용 교통카드 발급',
    applyUrl: 'https://www.bokjiro.go.kr',
  },
  {
    id: '12',
    category: '문화·체육',
    title: '스포츠강좌이용권',
    amount: '월 10만원 수강료 지원',
    eligibility: ['만 5세 ~ 18세 저소득층 유·청소년'],
    selectionCriteria: '기초생활수급자 및 차상위 가구 대상',
    applyUrl: 'https://svoucher.kspo.or.kr',
  },
];

const CULTURE_STORES: CultureStore[] = [
  { id: '1', name: 'CGV 영화관', category: '영화', region: '전국', address: '전국 CGV 주요 지점 및 앱 결제', type: '오프라인' },
  { id: '2', name: '롯데시네마', category: '영화', region: '전국', address: '전국 롯데시네마 영화관 및 웹예매', type: '오프라인' },
  { id: '3', name: '메가박스 (MEGABOX)', category: '영화', region: '전국', address: '전국 메가박스 지점', type: '오프라인' },
  { id: '4', name: '교보문고', category: '도서', region: '전국', address: '전국 교보문고 오프라인 매장 및 인터넷교보문고', type: '오프라인' },
  { id: '5', name: '영풍문고', category: '도서', region: '전국', address: '전국 주요 영풍문고 지점', type: '오프라인' },
  { id: '6', name: '알라딘 중고서점', category: '도서', region: '전국', address: '전국 알라딘 매장 및 온라인몰', type: '오프라인' },
  { id: '7', name: 'YES24 (예스24)', category: '도서/공연', region: '온라인', address: 'https://www.yes24.com', type: '온라인' },
  { id: '8', name: '인터파크 티켓/도서', category: '공연/도서', region: '온라인', address: 'https://ticket.interpark.com', type: '온라인' },
  { id: '9', name: '국립현대미술관', category: '전시/박물관', region: '서울/과천/청주', address: '서울 종로구 삼청로 30', type: '오프라인' },
  { id: '10', name: '국립중앙박물관', category: '전시/박물관', region: '서울', address: '서울 용산구 서빙고로 137', type: '오프라인' },
  { id: '11', name: '세종문화회관', category: '공연/음악', region: '서울', address: '서울 종로구 세종대로 175', type: '오프라인' },
  { id: '12', name: '예술의전당', category: '공연/전시', region: '서울', address: '서울 서초구 남부순환로 2406', type: '오프라인' },
  { id: '13', name: '에버랜드 / 케리비안베이', category: '테마파크', region: '경기 용인', address: '경기 용인시 처인구 포곡읍 에버랜드로 199', type: '오프라인' },
  { id: '14', name: '롯데월드 어드벤처', category: '테마파크', region: '서울', address: '서울 송파구 올림픽로 240', type: '오프라인' },
  { id: '15', name: '코엑스 아쿠아리움', category: '관광/체험', region: '서울', address: '서울 강남구 영동대로 513', type: '오프라인' },
  { id: '16', name: 'KBO 프로야구 구단 티켓', category: '스포츠', region: '전국', address: '티켓링크 / 인터파크 야구 예매', type: '온라인' },
  { id: '17', name: 'K리그 프로축구 티켓', category: '스포츠', region: '전국', address: '티켓링크 축구 예매', type: '온라인' },
  { id: '18', name: '코레일 (KTX/SRT 기차표)', category: '여행/숙박', region: '전국', address: '코레일톡 앱 및 KTX 역 창구', type: '오프라인' },
  { id: '19', name: '야놀자 / 여기어때 (문화누리 전용)', category: '숙박/여행', region: '온라인', address: '문화누리카드 전용 숙박 예약 페이지', type: '온라인' },
  { id: '20', name: '농협하나로마트 (일부 품목)', category: '생활/문화', region: '전국', address: '전국 농협하나로마트 지정 지점', type: '오프라인' },
];

export default function HomePage() {
  const [activeNav, setActiveNav] = useState<'benefits' | 'culture' | 'my'>('benefits');
  const [selectedItem, setSelectedItem] = useState<WelfareItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredWelfare = WELFARE_DATA.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesCategory = selectedCategory === '전체' || item.category === selectedCategory;
    const matchesSearch =
      query === '' ||
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.amount.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const filteredCultureStores = CULTURE_STORES.filter((store) => {
    const query = searchQuery.trim().toLowerCase();
    return (
      query === '' ||
      store.name.toLowerCase().includes(query) ||
      store.category.toLowerCase().includes(query) ||
      store.region.toLowerCase().includes(query) ||
      store.address.toLowerCase().includes(query) ||
      store.type.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 min-h-[840px] flex flex-col relative pb-16">
        
        <header className="bg-blue-600 text-white p-6 rounded-b-3xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold tracking-widest bg-white/20 px-2.5 py-1 rounded-full uppercase">
              AF Motif · Allfare
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">올페어 (Allfare)</h1>
          <p className="text-xs text-blue-100 mt-1">대한민국 모든 복지 혜택과 문화누리카드를 한눈에</p>
        </header>

        <div className="p-5 flex-1 flex flex-col">
          {activeNav === 'benefits' && (
            <div className="flex-1 flex flex-col">
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
                {['전체', '주거·중립', '보육·육아', '교통·혜택', '문화·체육'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="지원의 명칭이나 카테고리 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-gray-50 text-gray-800"
                />
              </div>

              <div className="space-y-3 flex-1 max-h-[500px] overflow-y-auto pr-1">
                {filteredWelfare.length > 0 ? (
                  filteredWelfare.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      <h3 className="font-bold text-gray-800 text-sm mt-1">{item.title}</h3>
                      <p className="text-xs font-medium text-blue-600 mt-1">{item.amount}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-xs text-gray-400">조회된 지원금 혜택이 없습니다.</div>
                )}
              </div>
            </div>
          )}

          {activeNav === 'culture' && (
            <div className="flex-1 flex flex-col">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="가맹점명(영화/CGV/교보문고), 지역, 업종 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-gray-50 text-gray-800"
                />
              </div>

              <div className="space-y-3 flex-1 max-h-[550px] overflow-y-auto pr-1">
                {filteredCultureStores.length > 0 ? (
                  filteredCultureStores.map((store) => (
                    <div
                      key={store.id}
                      className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex justify-between items-center"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                            {store.category}
                          </span>
                          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                            {store.type}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm mt-1.5">{store.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{store.address}</p>
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg whitespace-nowrap">
                        {store.region}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-xs text-gray-400">검색 조건에 일치하는 가맹점이 없습니다.</div>
                )}
              </div>
            </div>
          )}

          {activeNav === 'my' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mb-3">
                👤
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1">맞춤 혜택 설정</h3>
              <p className="text-xs text-gray-500 mb-6 max-w-[240px]">
                연령 및 소득 수준을 설정하면 나에게 꼭 맞는 복지 혜택을 우선 추천해 드립니다.
              </p>
              <div className="w-full space-y-3 text-left">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">연령대 선택</label>
                  <select className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-gray-800">
                    <option>청년 (만 19세 ~ 34세)</option>
                    <option>영유아/아동 보호자</option>
                    <option>중장년층</option>
                    <option>어르신 (만 65세 이상)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">가구 소득 수준</label>
                  <select className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-gray-800">
                    <option>중위소득 60% 이하</option>
                    <option>중위소득 100% 이하</option>
                    <option>기초생활수급자 / 차상위계층</option>
                    <option>상관없음 (전체 보기)</option>
                  </select>
                </div>
                <button className="w-full bg-blue-600 text-white font-bold py-3 text-xs rounded-xl shadow-md mt-2">
                  맞춤 혜택 적용하기
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2.5 z-40 rounded-b-3xl">
          <button
            onClick={() => { setActiveNav('benefits'); setSearchQuery(''); setSelectedCategory('전체'); }}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeNav === 'benefits' ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-base">🎁</span>
            <span className="text-[10px]">혜택조회</span>
          </button>

          <button
            onClick={() => { setActiveNav('culture'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeNav === 'culture' ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-base">💳</span>
            <span className="text-[10px]">문화누리</span>
          </button>

          <button
            onClick={() => { setActiveNav('my'); setSearchQuery(''); }}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeNav === 'my' ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-base">👤</span>
            <span className="text-[10px]">내 맞춤혜택</span>
          </button>
        </nav>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                {selectedItem.category}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <h2 className="text-lg font-bold text-gray-900">{selectedItem.title}</h2>
            <p className="text-sm font-bold text-blue-600 mt-1 mb-4">{selectedItem.amount}</p>

            <div className="space-y-3 mb-6">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 mb-1">지원 자격 요건</h4>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  {selectedItem.eligibility.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-800 mb-1">소득 및 선정 기준</h4>
                <p className="text-xs text-gray-600">{selectedItem.selectionCriteria}</p>
              </div>
            </div>

            <a
              href={selectedItem.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-600 text-white font-bold py-3 text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-md active:scale-[0.99]"
            >
              공식 사이트에서 신청하기 🚀
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
