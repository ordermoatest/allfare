'use client';

import React, { useState } from 'react';

// 복지 지원금 mock 데이터
interface WelfareItem {
  id: string;
  category: string;
  title: string;
  amount: string;
  eligibility: string[];
  selectionCriteria: string;
  applyUrl: string;
}

// 문화누리카드 가맹점 mock 데이터
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
];

const CULTURE_STORES: CultureStore[] = [
  { id: '1', name: 'CGV 영화관', category: '영화', region: '전국', address: '전국 주요 지점', type: '오프라인' },
  { id: '2', name: '교보문고', category: '도서', region: '전국', address: '전국 주요 매장 및 온라인 몰', type: '오프라인' },
  { id: '3', name: '알라딘 중고서점', category: '도서', region: '서울/경기/부산 등', address: '전국 매장', type: '오프라인' },
  { id: '4', name: 'Interpark 티켓/공연', category: '공연/티켓', region: '온라인', address: 'https://ticket.interpark.com', type: '온라인' },
  { id: '5', name: '국립현대미술관', category: '전시/박물관', region: '서울/과천/청주', address: '서울 종로구 삼청로 30', type: '오프라인' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'benefits' | 'culture'>('benefits');
  const [selectedItem, setSelectedItem] = useState<WelfareItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 혜택 지원금 필터링
  const filteredWelfare = WELFARE_DATA.filter((item) => {
    const matchesCategory = selectedCategory === '전체' || item.category === selectedCategory;
    const matchesSearch = item.title.includes(searchQuery) || item.category.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // 문화누리카드 사용처 필터링
  const filteredCultureStores = CULTURE_STORES.filter((store) => {
    return (
      store.name.includes(searchQuery) ||
      store.category.includes(searchQuery) ||
      store.region.includes(searchQuery) ||
      store.address.includes(searchQuery)
    );
  });

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 font-sans">
      {/* 상단 모바일/웹 컨테이너 */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 min-h-[840px] flex flex-col">
        
        {/* LF몰 스타일 미니멀 AF 헤더 */}
        <header className="bg-blue-600 text-white p-6 rounded-b-3xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold tracking-widest bg-white/20 px-2.5 py-1 rounded-full uppercase">
              AF Motif · Allfare
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">올페어 (Allfare)</h1>
          <p className="text-xs text-blue-100 mt-1">대한민국 모든 복지 혜택과 문화누리카드를 한눈에</p>

          {/* 메인 탭 선택 버튼 */}
          <div className="flex bg-blue-700/50 p-1 rounded-xl mt-4">
            <button
              onClick={() => { setActiveTab('benefits'); setSearchQuery(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'benefits' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:text-white'
              }`}
            >
              혜택지원금 한눈에 조회
            </button>
            <button
              onClick={() => { setActiveTab('culture'); setSearchQuery(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'culture' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:text-white'
              }`}
            >
              문화누리카드 사용처
            </button>
          </div>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <div className="p-5 flex-1 flex flex-col">

          {/* 1. 혜택 지원금 한눈에 조회 탭 */}
          {activeTab === 'benefits' && (
            <div className="flex-1 flex flex-col">
              {/* 카테고리 필터 태그 */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
                {['전체', '주거·중립', '보육·육아', '교통·혜택', '문화·체육'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* 검색창 */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="지원의 명칭이나 카테고리 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-gray-50"
                />
              </div>

              {/* 지원금 카드 리스트 */}
              <div className="space-y-3 flex-1">
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

          {/* 2. 문화누리카드 사용처 검색 탭 */}
          {activeTab === 'culture' && (
            <div className="flex-1 flex flex-col">
              {/* 검색창 */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="가맹점명, 업종(영화/서점), 지역 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-gray-50"
                />
              </div>

              {/* 사용처 리스트 */}
              <div className="space-y-3 flex-1">
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
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
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

        </div>
      </div>

      {/* 복지 지원금 상세 정보 모달 */}
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
                <h4 className="text-xs font-bold text-blue-800 mb-1">✅ 지원 자격 요건</h4>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  {selectedItem.eligibility.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-800 mb-1">📊 소득 및 선정 기준</h4>
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
