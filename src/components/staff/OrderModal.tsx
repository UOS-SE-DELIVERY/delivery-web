import { X } from 'lucide-react';
import { memo } from 'react';

import { StaffOrderDetailResponse } from '@/api/staff/order/order.api';
import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  OrderStatus,
} from '@/types/order';

interface OrderModalProps {
  order: StaffOrderDetailResponse | null;
  isLoading: boolean;
  onClose: () => void;
}

function OrderModalComponent({ order, isLoading, onClose }: OrderModalProps) {
  if (!order) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getOrderStatusBadgeClass(status)}`}
      >
        {getOrderStatusLabel(status)}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border-border relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="border-border bg-card sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-foreground text-xl font-bold">
              주문 상세 #{order.id}
            </h2>
            <p className="text-muted-foreground text-sm">
              {order.ordered_at && formatDate(order.ordered_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          </div>
        ) : (
          <div className="p-6">
            {/* 주문 정보 */}
            <div className="mb-6">
              <h3 className="text-foreground mb-3 text-lg font-semibold">
                주문 정보
              </h3>
              <div className="bg-muted/50 grid grid-cols-2 gap-4 rounded-lg p-4">
                <div>
                  <p className="text-muted-foreground text-sm">주문 출처</p>
                  <p className="text-foreground font-medium">
                    {order.order_source}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">상태</p>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">수령인</p>
                  <p className="text-foreground font-medium">
                    {order.receiver_name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">연락처</p>
                  <p className="text-foreground font-medium">
                    {order.receiver_phone || '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-sm">배달 주소</p>
                  <p className="text-foreground font-medium">
                    {order.delivery_address || '-'}
                  </p>
                  {order.place_label && (
                    <p className="text-muted-foreground text-sm">
                      ({order.place_label})
                    </p>
                  )}
                  {order.address_meta?.note && (
                    <p className="text-muted-foreground text-sm">
                      메모: {order.address_meta.note}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 식사 목록 */}
            {order.dinners && order.dinners.length > 0 && (
              <div className="mb-6">
                <h3 className="text-foreground mb-3 text-lg font-semibold">
                  식사 구성
                </h3>
                <div className="space-y-4">
                  {order.dinners.map(dinner => {
                    const dinnerTotal =
                      dinner.base_price_cents + dinner.style_adjust_cents;

                    return (
                      <div
                        key={dinner.id}
                        className="bg-muted/50 rounded-lg p-4"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <p className="text-foreground font-semibold">
                              {dinner.dinner_type.name}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                              스타일: {dinner.style.name}{' '}
                              {dinner.style_adjust_cents !== 0 && (
                                <span>
                                  ({dinner.style_adjust_cents > 0 ? '+' : ''}
                                  {dinner.style_adjust_cents.toLocaleString()}
                                  원)
                                </span>
                              )}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              수량: {dinner.quantity}
                              {dinner.person_label &&
                                ` (${dinner.person_label})`}
                            </p>
                          </div>
                          <p className="text-foreground text-right font-medium">
                            {dinnerTotal.toLocaleString()}원
                          </p>
                        </div>

                        {/* 식사 옵션 */}
                        {dinner.options && dinner.options.length > 0 && (
                          <div className="mb-3 border-t pt-3">
                            <p className="text-muted-foreground mb-2 text-sm font-medium">
                              디너 옵션:
                            </p>
                            <ul className="space-y-1">
                              {dinner.options.map(opt => (
                                <li
                                  key={opt.id}
                                  className="text-muted-foreground ml-4 flex items-start justify-between gap-2 text-sm"
                                >
                                  <span>
                                    • {opt.option_group_name}: {opt.option_name}
                                  </span>
                                  {opt.price_delta_cents !== 0 && (
                                    <span className="text-foreground shrink-0 text-xs">
                                      {opt.price_delta_cents > 0 ? '+' : ''}
                                      {opt.price_delta_cents.toLocaleString()}원
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 아이템 목록 */}
                        {dinner.items && dinner.items.length > 0 && (
                          <div className="border-t pt-3">
                            <p className="text-muted-foreground mb-2 text-sm font-medium">
                              구성 아이템:
                            </p>
                            <ul className="space-y-2">
                              {dinner.items.map(item => {
                                const qty = Number(item.final_qty);
                                const unitPrice = item.unit_price_cents || 0;
                                const itemBaseTotal = qty * unitPrice;

                                return (
                                  <li key={item.id} className="ml-4">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <div className="text-foreground flex items-center gap-2 font-medium">
                                          <span>• {item.item.name}</span>
                                          {!item.is_default && (
                                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                                              변경됨
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-muted-foreground mt-0.5 text-xs">
                                          {item.final_qty} ×{' '}
                                          {unitPrice.toLocaleString()}원
                                        </div>
                                      </div>
                                      <div className="text-foreground shrink-0 text-right font-medium">
                                        {itemBaseTotal.toLocaleString()}원
                                      </div>
                                    </div>

                                    {/* 아이템 옵션 */}
                                    {item.options &&
                                      item.options.length > 0 && (
                                        <ul className="mt-1 ml-4 space-y-0.5">
                                          {item.options.map(opt => (
                                            <li
                                              key={opt.id}
                                              className="text-muted-foreground flex items-start justify-between gap-2 text-xs"
                                            >
                                              <span>
                                                ∟ {opt.option_group_name}:{' '}
                                                {opt.option_name}
                                                {opt.multiplier &&
                                                  ` ×${opt.multiplier}`}
                                              </span>
                                              {opt.price_delta_cents !== 0 && (
                                                <span className="shrink-0">
                                                  {opt.price_delta_cents > 0
                                                    ? '+'
                                                    : ''}
                                                  {opt.price_delta_cents.toLocaleString()}
                                                  원
                                                </span>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {dinner.notes && (
                          <div className="text-muted-foreground mt-3 border-t pt-3 text-sm">
                            <span className="font-medium">메모:</span>{' '}
                            {dinner.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 쿠폰 & 멤버십 */}
            {((order.coupons && order.coupons.length > 0) ||
              order.membership) && (
              <div className="mb-6">
                <h3 className="text-foreground mb-3 text-lg font-semibold">
                  할인 정보
                </h3>
                <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                  {order.coupons?.map(coupon => (
                    <div
                      key={coupon.coupon}
                      className="text-muted-foreground flex items-center justify-between text-sm"
                    >
                      <span>쿠폰: {coupon.coupon}</span>
                      <span className="text-foreground font-medium">
                        -{coupon.amount_cents.toLocaleString()}원
                      </span>
                    </div>
                  ))}
                  {order.membership && (
                    <div className="text-muted-foreground flex items-center justify-between text-sm">
                      <span>멤버십 할인 ({order.membership.percent_off}%)</span>
                      <span className="text-foreground font-medium">활성</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 가격 정보 */}
            <div className="border-border border-t pt-4">
              <div className="space-y-2">
                <div className="text-muted-foreground flex justify-between text-sm">
                  <span>소계</span>
                  <span className="text-foreground font-medium">
                    {order.subtotal_cents?.toLocaleString()}원
                  </span>
                </div>
                {order.discount_cents > 0 && (
                  <div className="text-muted-foreground flex justify-between text-sm">
                    <span>할인</span>
                    <span className="font-medium text-red-600">
                      -{order.discount_cents?.toLocaleString()}원
                    </span>
                  </div>
                )}
                <div className="text-foreground flex justify-between border-t pt-2 text-lg font-bold">
                  <span>총계</span>
                  <span>{order.total_cents?.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const OrderModal = memo(OrderModalComponent);
