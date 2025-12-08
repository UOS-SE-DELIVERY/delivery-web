import { X } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

import { getCatalogItemsAPI } from '@/api/catalog/item.api';
import { patchOrderAPI } from '@/api/order/order.api';
import {
  getStaffOrderAPI,
  StaffOrderDetailResponse,
  StaffOrderItem,
} from '@/api/staff/order/order.api';
import type { ItemDetail, OptionGroup } from '@/types/item';
import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  OrderStatus,
} from '@/types/order';
import { asInt, formatCurrency, formatDate } from '@/utils/format';

interface OrderModalProps {
  orderId: number | null;
  onClose: () => void;
}

interface EditingItem {
  orderItemId: number;
  itemCode: string;
  itemDetail: ItemDetail | null;
  selectedOptions: Record<number, number[]>; // group_id -> option_ids[]
  isLoading: boolean;
}

function OrderModalComponent({ orderId, onClose }: OrderModalProps) {
  const [order, setOrder] = useState<StaffOrderDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const response = await getStaffOrderAPI(orderId);
        setOrder(response.data);
      } catch (error) {
        console.error('주문 상세 조회 실패:', error);
        alert('주문 상세 정보를 불러오지 못했습니다.');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, onClose]);

  // 모달이 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (orderId) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [orderId]);

  if (!orderId) return null;

  const handleEditItem = async (item: StaffOrderItem) => {
    setEditingItem({
      orderItemId: item.id,
      itemCode: item.item_code,
      itemDetail: null,
      selectedOptions: {},
      isLoading: true,
    });

    try {
      const itemDetail = await getCatalogItemsAPI(item.item_code);

      // 현재 선택된 옵션들을 매핑
      const currentOptions: Record<number, number[]> = {};

      itemDetail.option_groups.forEach(group => {
        const selectedInGroup = item.options
          .filter(opt => {
            // option_group_name으로 매칭
            return opt.option_group_name === group.name;
          })
          .map(opt => {
            // option_name으로 해당 option_id 찾기
            const matchingOption = group.options.find(
              o => o.name === opt.option_name,
            );
            return matchingOption?.option_id;
          })
          .filter((id): id is number => id !== undefined);

        if (selectedInGroup.length > 0) {
          currentOptions[group.group_id] = selectedInGroup;
        }
      });

      setEditingItem({
        orderItemId: item.id,
        itemCode: item.item_code,
        itemDetail,
        selectedOptions: currentOptions,
        isLoading: false,
      });
    } catch (error) {
      console.error('아이템 상세 정보 로드 실패:', error);
      alert('아이템 정보를 불러오지 못했습니다.');
      setEditingItem(null);
    }
  };

  const handleOptionToggle = (
    groupId: number,
    optionId: number,
    group: OptionGroup,
  ) => {
    if (!editingItem) return;

    setEditingItem(prev => {
      if (!prev) return prev;

      const currentSelections = prev.selectedOptions[groupId] || [];
      let newSelections: number[];

      if (group.select_mode === 'single') {
        // 단일 선택: 토글
        newSelections = currentSelections.includes(optionId) ? [] : [optionId];
      } else {
        // 다중 선택
        if (currentSelections.includes(optionId)) {
          // 이미 선택됨 -> 제거 (min_select 체크)
          newSelections = currentSelections.filter(id => id !== optionId);
          if (newSelections.length < group.min_select) {
            alert(`최소 ${group.min_select}개를 선택해야 합니다.`);
            return prev;
          }
        } else {
          // 선택 추가 (max_select 체크)
          if (currentSelections.length >= group.max_select) {
            alert(`최대 ${group.max_select}개까지 선택할 수 있습니다.`);
            return prev;
          }
          newSelections = [...currentSelections, optionId];
        }
      }

      return {
        ...prev,
        selectedOptions: {
          ...prev.selectedOptions,
          [groupId]: newSelections,
        },
      };
    });
  };

  const handleSaveItemOptions = async () => {
    if (!editingItem || !order) return;

    // 필수 그룹 검증
    const missingRequired = editingItem.itemDetail?.option_groups.find(
      group => {
        if (!group.is_required) return false;
        const selected = editingItem.selectedOptions[group.group_id] || [];
        return selected.length < group.min_select;
      },
    );

    if (missingRequired) {
      alert(`"${missingRequired.name}"은(는) 필수 선택 항목입니다.`);
      return;
    }

    setIsSaving(true);

    try {
      // 선택된 옵션 ID들을 평탄화
      const optionIds = Object.values(editingItem.selectedOptions).flat();

      // 수정된 아이템 찾기
      const updatedDinners = order.dinners?.map(dinner => {
        const updatedItems = dinner.items.map(item => {
          if (item.id === editingItem.orderItemId) {
            return {
              code: item.item_code,
              qty: item.final_qty,
              options: optionIds,
            };
          }
          return {
            code: item.item_code,
            qty: item.final_qty,
            options: item.options.map(opt => opt.id),
          };
        });

        return {
          dinner: {
            code: dinner.dinner_type.code,
            quantity: dinner.quantity,
            style: dinner.style.code,
            dinner_options: dinner.options?.map(opt => opt.id) || [],
          },
          items: updatedItems,
        };
      });

      // 전체 주문 정보 구성
      await patchOrderAPI(order.id, {
        dinners: updatedDinners,
      });

      alert('아이템 옵션이 수정되었습니다.');

      // 주문 정보 새로고침
      const response = await getStaffOrderAPI(orderId!);
      setOrder(response.data);
      setEditingItem(null);
    } catch (error) {
      console.error('아이템 옵션 수정 실패:', error);
      alert('아이템 옵션 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
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
        {isLoading || !order ? (
          <div className="flex h-64 items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          </div>
        ) : (
          <>
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
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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
                                    {formatCurrency(dinner.style_adjust_cents)})
                                  </span>
                                )}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                수량: {asInt(dinner.quantity)}
                                {dinner.person_label &&
                                  ` (${dinner.person_label})`}
                              </p>
                            </div>
                            <p className="text-foreground text-right font-medium">
                              {formatCurrency(dinnerTotal)}
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
                                      • {opt.option_group_name}:{' '}
                                      {opt.option_name}
                                    </span>
                                    {opt.price_delta_cents !== 0 && (
                                      <span className="text-foreground shrink-0 text-xs">
                                        {opt.price_delta_cents > 0 ? '+' : ''}
                                        {formatCurrency(opt.price_delta_cents)}
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
                                            <span>
                                              •{' '}
                                              {item.item.name || item.item_code}
                                            </span>
                                            {!item.is_default && (
                                              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                                                변경됨
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-muted-foreground mt-0.5 text-xs">
                                            {asInt(item.final_qty)} ×{' '}
                                            {formatCurrency(unitPrice)}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="text-foreground shrink-0 text-right font-medium">
                                            {formatCurrency(itemBaseTotal)}
                                          </div>
                                          <button
                                            onClick={() => handleEditItem(item)}
                                            className="text-primary hover:text-primary/80 text-xs underline"
                                          >
                                            옵션 수정
                                          </button>
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
                                                {opt.price_delta_cents !==
                                                  0 && (
                                                  <span className="shrink-0">
                                                    {opt.price_delta_cents > 0
                                                      ? '+'
                                                      : ''}
                                                    {formatCurrency(
                                                      opt.price_delta_cents,
                                                    )}
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
                          -{formatCurrency(coupon.amount_cents)}
                        </span>
                      </div>
                    ))}
                    {order.membership && (
                      <div className="text-muted-foreground flex items-center justify-between text-sm">
                        <span>
                          멤버십 할인 ({order.membership.percent_off}%)
                        </span>
                        <span className="text-foreground font-medium">
                          활성
                        </span>
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
                      {formatCurrency(order.subtotal_cents ?? 0)}
                    </span>
                  </div>
                  {order.discount_cents > 0 && (
                    <div className="text-muted-foreground flex justify-between text-sm">
                      <span>할인</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(order.discount_cents)}
                      </span>
                    </div>
                  )}
                  <div className="text-foreground flex justify-between border-t pt-2 text-lg font-bold">
                    <span>총계</span>
                    <span>{formatCurrency(order.total_cents ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 아이템 옵션 수정 모달 */}
      {editingItem && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-card border-border relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            {editingItem.isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="border-border sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
                  <h3 className="text-foreground text-lg font-semibold">
                    아이템 옵션 수정
                  </h3>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6">
                  {editingItem.itemDetail && (
                    <>
                      <div className="mb-6">
                        <h4 className="text-foreground text-xl font-bold">
                          {editingItem.itemDetail.name}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {editingItem.itemDetail.description}
                        </p>
                      </div>

                      {/* 옵션 그룹 */}
                      <div className="space-y-6">
                        {editingItem.itemDetail.option_groups.map(group => {
                          const selectedOptions =
                            editingItem.selectedOptions[group.group_id] || [];

                          return (
                            <div
                              key={group.group_id}
                              className="border-border rounded-lg border p-4"
                            >
                              <div className="mb-3 flex items-start justify-between">
                                <div>
                                  <h5 className="text-foreground font-semibold">
                                    {group.name}
                                    {group.is_required && (
                                      <span className="ml-1 text-red-500">
                                        *
                                      </span>
                                    )}
                                  </h5>
                                  <p className="text-muted-foreground text-xs">
                                    {group.select_mode === 'single'
                                      ? '하나를 선택하세요'
                                      : `${group.min_select}~${group.max_select}개 선택`}
                                  </p>
                                </div>
                                <span className="text-muted-foreground text-xs">
                                  {selectedOptions.length} 선택됨
                                </span>
                              </div>

                              <div className="space-y-2">
                                {group.options.map(option => {
                                  const isSelected = selectedOptions.includes(
                                    option.option_id,
                                  );

                                  return (
                                    <button
                                      key={option.option_id}
                                      onClick={() =>
                                        handleOptionToggle(
                                          group.group_id,
                                          option.option_id,
                                          group,
                                        )
                                      }
                                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                                        isSelected
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border hover:bg-muted/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                            isSelected
                                              ? 'border-primary bg-primary'
                                              : 'border-muted-foreground'
                                          }`}
                                        >
                                          {isSelected && (
                                            <div className="h-2 w-2 rounded-full bg-white"></div>
                                          )}
                                        </div>
                                        <span className="text-foreground font-medium">
                                          {option.name}
                                        </span>
                                      </div>
                                      {option.price_delta_cents !== 0 && (
                                        <span
                                          className={`text-sm ${
                                            option.price_delta_cents > 0
                                              ? 'text-foreground'
                                              : 'text-red-600'
                                          }`}
                                        >
                                          {option.price_delta_cents > 0
                                            ? '+'
                                            : ''}
                                          {formatCurrency(
                                            option.price_delta_cents,
                                          )}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 저장 버튼 */}
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => setEditingItem(null)}
                          className="bg-muted text-muted-foreground hover:bg-muted/80 flex-1 rounded-lg px-4 py-3 font-medium transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSaveItemOptions}
                          disabled={isSaving}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-lg px-4 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSaving ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const OrderModal = memo(OrderModalComponent);
