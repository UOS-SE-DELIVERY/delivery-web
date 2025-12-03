import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { getCatalogAPI } from '@/api/catalog/bootstrap.api';
import { getDinnerAPI } from '@/api/catalog/dinner.api';
import { ChatbotOrder } from '@/components/catalog/ChatbotOrder';
import { DinnerModal } from '@/components/catalog/DinnerModal';
import { LogInOutBtn } from '@/components/LogInOutBtn';
import { CatalogResponse, DinnerDetail } from '@/types/dinner';

export function Catalog() {
  const navigate = useNavigate();
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
      {/* 헤더 내비게이션 */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b bg-white/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/cart')}
              className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white"
            >
              장바구니
            </button>
            <button
              onClick={() => navigate('/orders/me')}
              className="rounded border px-4 py-2 hover:bg-gray-50"
            >
              나의 주문
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="rounded border px-4 py-2 hover:bg-gray-50"
            >
              나의 정보
            </button>
          </div>
          <LogInOutBtn />
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 로딩 스켈레톤 */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4">
              <div className="animate-pulse">
                <div className="h-5 w-2/3 rounded bg-gray-200" />
                <div className="mt-2 h-4 w-full rounded bg-gray-100" />
                <div className="mt-6 h-32 w-full rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 디너 목록 */}
      {catalog?.dinners && !loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {catalog.dinners.map((dinner, idx) => {
            const isActive = dinner.active;
            const priceLabel =
              dinner.base_price_cents !== undefined &&
              dinner.base_price_cents !== null
                ? `${dinner.base_price_cents.toLocaleString()}원`
                : '-';
            return (
              <div
                key={dinner.code || dinner.dinner_type_id || idx}
                className={`group relative rounded-xl border bg-white p-4 shadow-sm transition ${
                  isActive && !detailLoading
                    ? 'hover:border-primary/40 cursor-pointer hover:shadow-md'
                    : 'cursor-not-allowed opacity-60'
                }`}
                onClick={async () => {
                  if (isActive && dinner.code) {
                    setDetailLoading(true);
                    try {
                      const res = await getDinnerAPI(dinner.code);
                      setSelectedDinner(res.data);
                    } catch (err) {
                      const message =
                        err instanceof Error
                          ? err.message
                          : (
                              err as {
                                response?: { data?: { message?: string } };
                              }
                            )?.response?.data?.message;
                      alert(message || '디너 정보를 불러오지 못했습니다.');
                    } finally {
                      setDetailLoading(false);
                    }
                  }
                }}
                tabIndex={isActive ? 0 : -1}
                aria-disabled={!isActive}
              >
                {/* 가격 배지 */}
                <div className="absolute top-4 right-4">
                  <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                    {priceLabel}
                  </span>
                </div>

                {/* 제목/설명 */}
                <div className="pr-20">
                  <h2 className="text-lg font-bold">{dinner.name}</h2>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    {dinner.description}
                  </p>
                </div>

                {/* 비활성 오버레이/배지 */}
                {!isActive && (
                  <>
                    <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/60 backdrop-blur-[1px]" />
                    <span className="absolute right-4 bottom-4 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                      주문 불가
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 디너 상세 정보 모달 */}
      {selectedDinner && (
        <DinnerModal
          dinner={selectedDinner}
          onClose={() => setSelectedDinner(null)}
        />
      )}

      {/* 챗봇 주문 */}
      <ChatbotOrder />
    </div>
  );
}
