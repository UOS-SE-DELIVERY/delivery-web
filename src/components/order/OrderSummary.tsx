import type { DinnerCart } from '@/types/cart';
import { calculateDinnerPrice } from '@/utils/orderPrice';

interface OrderSummaryProps {
  dinner: DinnerCart;
}

export function OrderSummary({ dinner }: OrderSummaryProps) {
  const { basePrice, total } = calculateDinnerPrice(dinner);

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-3">
        <div className="text-lg font-semibold">{dinner.dinner.name}</div>
        <div className="text-muted-foreground text-sm">
          {dinner.dinner.description}
        </div>
      </div>
      <div className="space-y-1 text-sm">
        <div>
          <span className="text-muted-foreground">수량:</span>
          <span className="ml-2 font-medium">{dinner.quantity}</span>
        </div>
        <div>
          <span className="text-muted-foreground">스타일:</span>
          <span className="ml-2 font-medium">
            {dinner.dinner.style ?? '기본'}
          </span>
        </div>

        {/* 디너 옵션 표시 */}
        {dinner.dinner.dinner_options &&
          dinner.dinner.dinner_options.length > 0 && (
            <div className="mt-2">
              <span className="text-muted-foreground">옵션:</span>
              <div className="mt-1 ml-2 space-y-1">
                {dinner.dinner.dinner_options.map(optionId => {
                  // option_groups에서 해당 옵션 찾기
                  let optionInfo = null;
                  for (const og of dinner.option_groups) {
                    const opt = og.options.find(o => o.option_id === optionId);
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
      </div>

      <div className="mt-3 border-t pt-3">
        <div>
          <span className="text-muted-foreground text-sm">총 가격:</span>
          <span className="text-primary ml-2 text-lg font-bold">
            {total.toLocaleString()}원
          </span>
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          (기본 {basePrice.toLocaleString()}원 / 옵션 + 스타일 반영)
        </div>
      </div>

      {dinner.default_items.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold">기본 구성</div>
          <div className="space-y-2">
            {dinner.default_items.map(di => (
              <div
                key={di.item.code}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium">{di.item.name}</div>
                  {di.item.base_price_cents !== 0 && (
                    <div className="text-muted-foreground text-xs">
                      {di.item.base_price_cents.toLocaleString()}원
                    </div>
                  )}
                </div>
                <div className="text-muted-foreground">
                  수량: {di.default_qty}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 추가 선택 옵션 (아이템 옵션) */}
      {dinner.items && dinner.items.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold">추가 선택 옵션</div>
          <div className="space-y-2 text-sm">
            {dinner.items.map(add => {
              const itemCode = add.code.split('__opt_')[0];
              const matchedItem = dinner.default_items.find(
                di => di.item.code === itemCode,
              );
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
        </div>
      )}
    </div>
  );
}
