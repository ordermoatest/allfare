'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Subsidy {
  id: string;
  service_id: string;
  title: string;
  category: string;
  amount: string;
  target_age: string;
  target_income: string;
  target_house: string;
  requirements: string[];
  selection_criteria: string;
  exclusions: string[];
  documents: string[];
  provider: string;
  dday: string;
  apply_url: string;
}

export default function HomePage() {
  const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
  const [selectedItem, setSelectedItem] = useState<Subsidy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase.from('welfare_services').select('*');
      if (!error && data) {
        setSubsidies(data);
      }
      setLoading(false);
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
          <p className="text-xs text-gray-400 text-center py-10">데이터를 불러오는 중...</p>
        ) : (
          subsidies.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer"
            >
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                {item.category}
              </span>
              <h3 className="text-sm font-bold mt-1">{item.title}</h3>
              <p className="text-xs font-black text-blue-600 mt-2">{item.amount}</p>
            </div>
          ))
        )}
      </section>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-gray-400 text-lg font-bold"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold mb-1">{selectedItem.title}</h2>
            <p className="text-xl font-black text-blue-600 mb-4">{selectedItem.amount}</p>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-1">✅ 지원 자격 요건</h4>
                <p>{selectedItem.requirements?.[0]}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-900 mb-1">📊 소득 및 선정 기준</h4>
                <p>{selectedItem.selection_criteria}</p>
              </div>
            </div>

            <a
              href={selectedItem.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl block text-center font-bold text-xs"
            >
              공식 사이트에서 신청하기 🚀
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
