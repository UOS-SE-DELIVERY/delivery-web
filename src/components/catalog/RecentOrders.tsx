import { useNavigate } from 'react-router';

import { getDinnerAPI } from '@/api/catalog/dinner.api';
import { useOrders } from '@/hooks/order/useOrders';
import { useAuthStore } from '@/store/authStore';
import type { CartEntry } from '@/types/cart';
import type { DinnerDetail } from '@/types/dinner';
import type {
  OrderDinnerOption,
  OrderItemOption,
  OrderResponse,
  OrderStatus,
} from '@/types/order';
import { getOrderStatusBadgeClass, getOrderStatusLabel } from '@/types/order';
import { asInt, formatCurrency, formatDateTime } from '@/utils/format';

export function RecentOrders() {
  const navigate = useNavigate();
  const isLogin = useAuthStore(s => s.isLogin);
  const { orders, loading } = useOrders();

  const statusBadgeClass = (status: OrderStatus) => {
    const base =
      'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium';
    return `${base} ${getOrderStatusBadgeClass(status)}`;
  };

  if (!isLogin) {
    return null;
  }

  if (loading) {
    return (
      <div className="mb-6 rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">최근 주문</h2>
        <p className="text-muted-foreground text-sm">로딩 중...</p>
      </div>
    );
  }

  // 최신 3개만 표시
  const recentOrders = orders.slice(0, 3);

  if (recentOrders.length === 0) {
    return null;
  }

  const handleReorder = async (order: OrderResponse) => {
    try {
      // OrderResponse를 CartEntry 형식으로 변환 (카탈로그에서 최신 정보 가져오기)
      const entries: CartEntry[] = await Promise.all(
        order.dinners.map(async dinner => {
          try {
            // 카탈로그에서 디너 상세 정보 가져오기
            const dinnerDetailRes = await getDinnerAPI(dinner.dinner_code);

            if (!dinnerDetailRes?.data) {
              throw new Error(
                `디너 정보를 찾을 수 없습니다: ${dinner.dinner_name}`,
              );
            }

            const dinnerDetail = dinnerDetailRes.data as DinnerDetail;

            // 디너 옵션 ID를 그대로 사용
            const dinnerOptions = dinner.options?.map(opt => opt.id) || [];

            // 모든 아이템을 처리
            // 1) 옵션이 있는 아이템: qty와 관계없이 무조건 포함 (qty는 default와의 차이값)
            // 2) 옵션이 없는 아이템: qty가 0이 아닌 경우만 포함
            const items = (dinner.items || [])
              .map(item => {
                try {
                  const itemOptions = item.options?.map(opt => opt.id) || [];

                  // 옵션이 있는 경우
                  if (itemOptions.length > 0) {
                    // 카탈로그에서 해당 아이템의 default_qty 찾기
                    const defaultItem = dinnerDetail.default_items.find(
                      di => di.item.code === item.item_code,
                    );
                    const defaultQty = defaultItem
                      ? (typeof defaultItem.default_qty === 'string'
                          ? parseInt(defaultItem.default_qty)
                          : defaultItem.default_qty) || 0
                      : 0;
                    const finalQty =
                      (typeof item.final_qty === 'string'
                        ? parseInt(item.final_qty)
                        : item.final_qty) || 0;
                    const additionalQty = finalQty - defaultQty;

                    // 옵션이 있으면 첫 번째 옵션 ID를 code에 추가
                    const itemCode = `${item.item_code}__opt_${itemOptions[0]}`;

                    return {
                      code: itemCode,
                      qty: additionalQty,
                      options: itemOptions,
                    };
                  }

                  // 옵션이 없는 경우: default_qty와 다른 경우만
                  const defaultItem = dinnerDetail.default_items.find(
                    di => di.item.code === item.item_code,
                  );
                  const defaultQty = defaultItem
                    ? (typeof defaultItem.default_qty === 'string'
                        ? parseInt(defaultItem.default_qty)
                        : defaultItem.default_qty) || 0
                    : 0;
                  const finalQty =
                    (typeof item.final_qty === 'string'
                      ? parseInt(item.final_qty)
                      : item.final_qty) || 0;
                  const additionalQty = finalQty - defaultQty;

                  // additionalQty가 0이 아닌 경우만 반환
                  if (additionalQty !== 0) {
                    return {
                      code: item.item_code,
                      qty: additionalQty,
                      options: [],
                    };
                  }

                  return null;
                } catch (itemError) {
                  console.error(
                    `아이템 처리 오류 (${item.item_name}):`,
                    itemError,
                  );
                  return null;
                }
              })
              .filter(
                (item): item is NonNullable<typeof item> => item !== null,
              );

            const cartEntry: CartEntry = {
              id: `reorder_${order.id}_${dinner.id}_${Date.now()}`,
              dinner: {
                dinner: {
                  dinner_type_id: dinnerDetail.dinner.dinner_type_id,
                  code: dinner.dinner_code,
                  name: dinner.dinner_name,
                  description: dinnerDetail.dinner.description,
                  base_price_cents: dinnerDetail.dinner.base_price_cents,
                  style: dinner.style_code,
                  dinner_options: dinnerOptions,
                },
                quantity: parseInt(dinner.quantity) || 1,
                // DinnerModal 패턴: default_qty를 정수화
                default_items: dinnerDetail.default_items.map(di => ({
                  ...di,
                  default_qty: Math.floor(
                    typeof di.default_qty === 'string'
                      ? parseFloat(di.default_qty)
                      : di.default_qty,
                  ),
                })),
                option_groups: dinnerDetail.option_groups,
                allowed_styles: dinnerDetail.allowed_styles,
                items,
              },
            };

            return cartEntry;
          } catch (dinnerError) {
            console.error(
              `디너 처리 오류 (${dinner.dinner_name}):`,
              dinnerError,
            );
            throw dinnerError;
          }
        }),
      );

      if (entries.length === 0) {
        alert('재주문할 수 있는 항목이 없습니다.');
        return;
      }

      // Order 페이지로 바로 이동
      navigate('/orders', { state: { entries } });
    } catch (error) {
      console.error('재주문 중 오류 발생:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '재주문 정보를 가져오는데 실패했습니다.';
      alert(errorMessage);
    }
  };

  return (
    <div className="mb-6 rounded-lg border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">최근 주문</h2>
        <button
          onClick={() => navigate('/orders/me')}
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          전체 보기 →
        </button>
      </div>

      <div className="space-y-3">
        {recentOrders.map(order => (
          <div
            key={order.id}
            className="rounded-lg border bg-gray-50 p-4 transition-colors hover:bg-gray-100"
          >
            <div className="mb-3 flex items-start justify-between border-b pb-3">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className={statusBadgeClass(order.status)}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDateTime(order.ordered_at)}
                  </span>
                </div>
                <div className="space-y-2">
                  {order.dinners.map(dinner => (
                    <div key={dinner.id} className="text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <div>
                          <span className="font-medium">
                            {dinner.dinner_name}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            수량 {asInt(dinner.quantity)} · 스타일{' '}
                            {dinner.style_name}
                          </span>
                        </div>
                      </div>

                      {/* 디너 옵션 */}
                      {dinner.options?.length > 0 && (
                        <div className="mt-2 ml-4 text-xs">
                          <div className="font-medium text-gray-600">
                            디너 옵션:
                          </div>
                          <ul className="mt-1 ml-4 space-y-0.5">
                            {dinner.options.map((opt: OrderDinnerOption) => (
                              <li
                                key={opt.id}
                                className="text-muted-foreground flex items-start justify-between gap-2"
                              >
                                <span>
                                  {opt.option_group_name}: {opt.option_name}
                                </span>
                                {opt.price_delta_cents !== 0 && (
                                  <span className="shrink-0">
                                    ({opt.price_delta_cents > 0 ? '+' : ''}
                                    {formatCurrency(opt.price_delta_cents)})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 아이템 구성 */}
                      {dinner.items?.length > 0 && (
                        <div className="mt-3 ml-4 text-xs">
                          <div className="font-medium text-gray-600">
                            구성 아이템:
                          </div>
                          <ul className="mt-1 space-y-2">
                            {dinner.items.map(item => {
                              const qty = Number(item.final_qty);
                              const unitPrice = item.unit_price_cents || 0;

                              // 아이템 옵션 정보 수집
                              const selectedOptionsInfo: Array<{
                                groupName: string;
                                optionName: string;
                                priceDelta: number;
                              }> = [];
                              if (item.options?.length) {
                                // default_items에서 매칭되는 아이템 찾기
                                const matchedDefaultItem = order.dinners
                                  .find(d => d.id === dinner.id)
                                  ?.items.find(
                                    i => i.item_code === item.item_code,
                                  );

                                // 실제로는 이미 OrderItemOption 형태로 받고 있음
                                item.options.forEach((o: OrderItemOption) => {
                                  selectedOptionsInfo.push({
                                    groupName: o.option_group_name,
                                    optionName: o.option_name,
                                    priceDelta: o.price_delta_cents,
                                  });
                                });
                              }

                              return (
                                <li key={item.id} className="ml-4">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-gray-800">
                                        • {item.item_name}
                                      </div>
                                      <div className="text-muted-foreground mt-0.5">
                                        수량 {asInt(item.final_qty)}
                                        {unitPrice !== 0 &&
                                          ` × ${formatCurrency(unitPrice)}`}
                                      </div>
                                    </div>
                                  </div>

                                  {/* 아이템 옵션 */}
                                  {selectedOptionsInfo.length > 0 && (
                                    <div className="text-muted-foreground mt-1 ml-4 space-y-0.5">
                                      {selectedOptionsInfo.map((info, idx) => (
                                        <div key={idx}>
                                          {info.groupName}: {info.optionName}
                                          {info.priceDelta !== 0 && (
                                            <span className="ml-1">
                                              ({info.priceDelta > 0 ? '+' : ''}
                                              {formatCurrency(info.priceDelta)})
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className="text-primary mb-2 font-semibold">
                  {formatCurrency(order.total_cents)}
                </div>
                {order.discount_cents > 0 && (
                  <div className="text-muted-foreground mb-2 text-xs">
                    할인 {formatCurrency(order.discount_cents)} 적용
                  </div>
                )}
                <button
                  onClick={() => handleReorder(order)}
                  className="bg-primary hover:bg-primary/90 rounded px-3 py-1.5 text-sm font-medium text-white transition-colors"
                >
                  재주문
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
