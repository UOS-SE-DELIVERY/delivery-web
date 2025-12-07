import { getDinnerAPI } from '@/api/catalog/dinner.api';
import type { CatalogDinner, DinnerDetail } from '@/types/dinner';

interface DinnerListProps {
  dinners: CatalogDinner[];
  loading: boolean;
  detailLoading: boolean;
  onSelectDinner: (dinner: DinnerDetail) => void;
  onLoadingChange: (loading: boolean) => void;
}

export function DinnerList({
  dinners,
  loading,
  detailLoading,
  onSelectDinner,
  onLoadingChange,
}: DinnerListProps) {
  const handleDinnerClick = async (dinner: CatalogDinner) => {
    if (dinner.active && dinner.code) {
      onLoadingChange(true);
      try {
        const res = await getDinnerAPI(dinner.code);
        onSelectDinner(res.data);
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
        onLoadingChange(false);
      }
    }
  };

  // 로딩 스켈레톤
  if (loading) {
    return (
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
    );
  }

  // 디너 목록
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {dinners.map((dinner, idx) => {
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
            onClick={() => handleDinnerClick(dinner)}
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
  );
}
