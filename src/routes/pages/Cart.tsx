import { useNavigate } from 'react-router';

import { useAuthStore } from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import { calculateDinnerPrice } from '@/utils/orderPrice';

export function Cart() {
  const navigate = useNavigate();

  const entries = useCartStore(state => state.entries);
  const removeEntry = useCartStore(state => state.removeEntry);
  const clearCart = useCartStore(state => state.clearCart);
  const isLogin = useAuthStore(state => state.isLogin);

  const handleOrder = (entry: (typeof entries)[0]) => {
    if (!isLogin) {
      alert('로그인이 필요합니다.');
      navigate('/login', { state: { redirectTo: '/orders', entry } });
      return;
    }
    navigate('/orders', { state: { entry } });
  };

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
          {entries.map(entry => (
            <div key={entry.id} className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
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
                                {item.item.base_price_cents.toLocaleString()}원
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
                                          {info.priceDelta.toLocaleString()}원)
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
                        {total.toLocaleString()}원
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        (기본 {basePrice.toLocaleString()}원 / 옵션 + 스타일
                        반영)
                      </div>
                    </div>
                  );
                })()}
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="rounded border px-4 py-2 hover:bg-gray-50"
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => handleOrder(entry)}
                    className="bg-primary hover:bg-primary/90 rounded px-6 py-2 text-white"
                  >
                    주문하기
                  </button>
                </div>
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
