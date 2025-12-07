import { useEffect, useState } from 'react';

import { getCatalogAPI } from '@/api/catalog/bootstrap.api';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { ChatbotOrder } from '@/components/catalog/ChatbotOrder';
import { DinnerList } from '@/components/catalog/DinnerList';
import { DinnerModal } from '@/components/catalog/DinnerModal';
import { RecentOrders } from '@/components/catalog/RecentOrders';
import { CatalogResponse, DinnerDetail } from '@/types/dinner';

export function Catalog() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDinner, setSelectedDinner] = useState<DinnerDetail | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCatalogAPI();
        setCatalog(res.data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : (err as { response?: { data?: { message?: string } } })?.response
                ?.data?.message;
        setError(message || '카탈로그를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-4">
      <CatalogHeader />

      {/* 에러 표시 */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 디너 목록 */}
      {catalog?.dinners && (
        <DinnerList
          dinners={catalog.dinners}
          loading={loading}
          detailLoading={detailLoading}
          onSelectDinner={setSelectedDinner}
          onLoadingChange={setDetailLoading}
        />
      )}

      {/* 최근 주문 */}
      <div className="mt-8">
        <RecentOrders />
      </div>

      {/* 디너 상세 정보 모달 */}
      {selectedDinner && (
        <DinnerModal
          dinner={selectedDinner}
          onClose={() => setSelectedDinner(null)}
        />
      )}

      <ChatbotOrder />
    </div>
  );
}
