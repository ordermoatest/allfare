'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Subsidy {
  id: string;
  service_id?: string;
  title: string;
  category: string;
  amount: string;
  target_age?: string;
  target_income?: string;
  target_house?: string;
  requirements?: string[];
  selection_criteria?: string;
  exclusions?: string[];
  documents?: string[];
  provider?: string;
  dday?: string;
  apply_url?: string;
}

// Supabase 데이터가 없을 때 기본으로 보여줄 예시 데이터
const MOCK_DATA: Subsidy[] = [
  {
    id: '1',
    title: '청년월세 특별지원',
    category: '주거·중립',
    amount: '월 최대 20만원 (최대 12개월)',
    requirements: ['만 19세 ~ 34세 무주택 청년', '청년독립가구 중위소득 60% 이하'],
    selection_criteria: '소득 및 재산 요건 충족 시 선발',
    apply_url: 'https://www.bokjiro.go.kr'
  },
  {
    id: '2',
    title: '부모급여 지원',
    category: '보육·육아',
    amount: '월 50만 ~ 100만원',
    requirements: ['0세~1세 아동을 양육하는 부모'],
    selection_criteria: '소득 상관없이 연령 조건 충족 시 지급',
    apply_url: 'https://www.bokjiro.go.kr'
  },
  {
    id: '3',
    title: 'K-패스 교통비 환급',
    category: '교통·혜택',
    amount: '대중교통비 20% ~ 53% 환급',
    requirements: ['월 15회 이상 대중교통 이용자'],
    selection_criteria: '일반 20%, 청년 30%, 저소득층 53% 환급',
    apply_url: 'https://korea-pass.kr'
  }
];

export default function HomePage() {
  const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
  const [selectedItem, setSelectedItem] = useState<Subsidy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase.from('welfare_services').select('*');
        
        // Supabase에 데이터가 있으면 적용, 없거나 에러 시 MOCK 데이터 사용
        if (!error && data && data.length > 0) {
          setSubsidies(data);
        } else {
          console.warn('Supabase 데이터가 없거나 에러 발생, 기본 데이터를 표시합니다.', error);
          setSubsidies(MOCK_DATA);
        }
      } catch (err) {
        console.error('데이터 로딩 중 오류 발생:', err);
        setSubsidies(MOCK_DATA);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto shadow-sm">
      <header className="bg-blue-600 text-white p-6 rounded-b-3xl">
        <h1 className="text-2xl font-black">✨ 올페어 (Allfare)</h1>
        <p className="text-xs text-blue-100 mt-1">대한민국 모든 복지와 혜택을 탭하다</p>
      </header>

      <section className="p-5 space-y-3">
        {loading ? (
          <div className="text-center py-10 space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400">맞춤 복지 혜택을 불러오는 중...</p>
          </div>
        ) : subsidies.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-10">등록된 혜택 정보가 없습니다.</p>
        ) : (
          subsidies.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-blue-200 transition-all active:scale-[0.98]"
            >
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                {item.category || '복지혜택'}
              </span>
              <h3 className="text-sm font-bold mt-1 text-gray-900">{item.title}</h3>
              <p className="text-xs font-black text-blue-600 mt-2">{item.amount}</p>
            </div>
          ))
        )}
      </section>

      {/* 모달 상세보기 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
            >
              ✕
            </button>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {selectedItem.category || '복지혜택'}
            </span>
            <h2 className="text-lg font-bold mt-2 mb-1">{selectedItem.title}</h2>
            <p className="text-xl font-black text-blue-600 mb-4">{selectedItem.amount}</p>

            <div className="space-y-3 text-xs text-gray-600">
              {selectedItem.requirements && selectedItem.requirements.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-1">✅ 지원 자격 요건</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedItem.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedItem.selection_criteria && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-900 mb-1">📊 소득 및 선정 기준</h4>
                  <p>{selectedItem.selection_criteria}</p>
                </div>
              )}
            </div>

            {selectedItem.apply_url && (
              <a
                href={selectedItem.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl block text-center font-bold text-xs transition-colors"
              >
                공식 사이트에서 신청하기 🚀
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
