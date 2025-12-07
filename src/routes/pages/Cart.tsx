import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useAuthStore } from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import { formatCurrency } from '@/utils/format';
import { calculateDinnerPrice } from '@/utils/orderPrice';

export function Cart() {
  const navigate = useNavigate();

  const entries = useCartStore(state => state.entries);
  const removeEntry = useCartStore(state => state.removeEntry);
  const clearCart = useCartStore(state => state.clearCart);
  const isLogin = useAuthStore(state => state.isLogin);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (entryId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)));
    }
  };

  const handleOrder = () => {
    if (selectedIds.size === 0) {
      alert('주문할 항목을 선택해주세요.');
      return;
    }

    if (!isLogin) {
      alert('로그인이 필요합니다.');
      const selectedEntries = entries.filter(e => selectedIds.has(e.id));
      navigate('/login', {
        state: { redirectTo: '/orders', entries: selectedEntries },
      });
      return;
    }

    const selectedEntries = entries.filter(e => selectedIds.has(e.id));
    navigate('/orders', { state: { entries: selectedEntries } });
  };

  const selectedTotal = entries
    .filter(e => selectedIds.has(e.id))
    .reduce((sum, entry) => {
      const { total } = calculateDinnerPrice(entry.dinner);
      return sum + total;
    }, 0);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">장바구니</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/catalog')}
            className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white"
          >
            카탈로그로 돌아가기
          </button>
          <button
            onClick={() => clearCart()}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            전체 비우기
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center">
          <p className="text-muted-foreground mb-4">장바구니가 비어있습니다</p>
          <button
            onClick={() => navigate('/catalog')}
            className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white"
          >
            메뉴 보러가기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 전체 선택 체크박스 */}
          <div className="flex items-center justify-between rounded-lg border bg-white p-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={
                  selectedIds.size === entries.length && entries.length > 0
                }
                onChange={handleSelectAll}
                className="h-5 w-5"
              />
              <span className="font-medium">
                전체 선택 ({selectedIds.size}/{entries.length})
              </span>
            </label>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  선택된 항목 총액:{' '}
                  <span className="text-primary font-semibold">
                    {formatCurrency(selectedTotal)}
                  </span>
                </span>
                <button
                  onClick={handleOrder}
                  className="bg-primary hover:bg-primary/90 rounded px-6 py-2 font-medium text-white"
                >
                  선택 항목 주문하기
                </button>
              </div>
            )}
          </div>

          {entries.map(entry => (
            <div key={entry.id} className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-start gap-4">
                {/* 체크박스 */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(entry.id)}
                  onChange={() => handleToggleSelect(entry.id)}
                  className="mt-1 h-5 w-5 cursor-pointer"
                />

                <div className="flex-1">
                  <h2 className="text-xl font-semibold">
                    {entry.dinner.dinner.name}
                  </h2>
                  <div className="text-muted-foreground text-sm">
                    {entry.dinner.dinner.description}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">수량:</span>
                    <span className="ml-2 font-medium">
                      {entry.dinner.quantity}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-muted-foreground">스타일:</span>
                    <span className="ml-2 font-medium">
                      {entry.dinner.dinner.style ?? '기본'}
                    </span>
                  </div>

                  {/* 디너 옵션 표시 */}
                  {entry.dinner.dinner.dinner_options &&
                    entry.dinner.dinner.dinner_options.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">옵션:</span>
                        <div className="mt-1 ml-2 space-y-1">
                          {entry.dinner.dinner.dinner_options.map(optionId => {
                            // option_groups에서 해당 옵션 찾기
                            let optionInfo = null;
                            for (const og of entry.dinner.option_groups) {
                              const opt = og.options.find(
                                o => o.option_id === optionId,
                              );
                              if (opt) {
                                optionInfo = {
                                  groupName: og.name,
                                  optionName: opt.name,
                                  priceDelta: opt.price_delta_cents,
                                };
                                break;
                              }
                            }
                            return optionInfo ? (
                              <div
                                key={optionId}
                                className="text-muted-foreground text-xs"
                              >
                                {optionInfo.groupName}: {optionInfo.optionName}
                                {optionInfo.priceDelta !== 0 && (
                                  <span className="ml-1">
                                    ({optionInfo.priceDelta > 0 ? '+' : ''}
                                    {optionInfo.priceDelta.toLocaleString()}원)
                                  </span>
                                )}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                  {entry.dinner.default_items.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {entry.dinner.default_items.map(item => (
                        <div
                          key={item.item.code}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium">{item.item.name}</div>
                            {item.item.base_price_cents !== 0 && (
                              <div className="text-muted-foreground text-xs">
                                {formatCurrency(item.item.base_price_cents)}
                              </div>
                            )}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            수량: {item.default_qty}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 추가 옵션으로 선택된 items */}
                  {entry.dinner.items && entry.dinner.items.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm font-semibold">
                        추가 선택 옵션
                      </div>
                      {entry.dinner.items.map(add => {
                        // code에서 실제 item code 추출 (형식: itemCode__opt_optionId)
                        const itemCode = add.code.split('__opt_')[0];

                        // default_items에서 매칭되는 아이템 찾기
                        const matchedItem = entry.dinner.default_items.find(
                          di => di.item.code === itemCode,
                        );

                        // 선택된 옵션들의 정보 찾기 (그룹명, 옵션명, 가격)
                        const selectedOptionsInfo: Array<{
                          groupName: string;
                          optionName: string;
                          priceDelta: number;
                        }> = [];
                        if (add.options && matchedItem) {
                          matchedItem.item.option_groups.forEach(og => {
                            og.options.forEach(opt => {
                              if (add.options!.includes(opt.option_id)) {
                                selectedOptionsInfo.push({
                                  groupName: og.name,
                                  optionName: opt.name,
                                  priceDelta: opt.price_delta_cents,
                                });
                              }
                            });
                          });
                        }

                        return (
                          <div key={add.code} className="text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {matchedItem ? matchedItem.item.name : add.code}
                              </span>
                              {selectedOptionsInfo.length > 0 && (
                                <div className="text-muted-foreground text-xs">
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {(() => {
                  const { basePrice, total } = calculateDinnerPrice(
                    entry.dinner,
                  );
                  return (
                    <div className="text-right">
                      <div className="text-primary text-xl font-bold">
                        {formatCurrency(total)}
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        (기본 {formatCurrency(basePrice)} / 옵션 + 스타일 반영)
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="rounded border px-4 py-2 hover:bg-gray-50"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end rounded-lg border bg-white p-6">
            <button
              onClick={() => navigate('/catalog')}
              className="rounded border px-4 py-2 hover:bg-gray-50"
            >
              계속 쇼핑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
