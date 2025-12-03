import { useState } from 'react';
import { useNavigate } from 'react-router';

import useCartStore from '@/store/cartStore';
import { DinnerDetail } from '@/types/dinner';

interface DinnerModalProps {
  dinner: DinnerDetail;
  onClose: () => void;
}

export function DinnerModal({ dinner, onClose }: DinnerModalProps) {
  const navigate = useNavigate();
  const addEntryFromDinner = useCartStore(state => state.addEntryFromDinner);
  const [selectedStyle, setSelectedStyle] = useState<string | undefined>(
    dinner.allowed_styles[0]?.code,
  );
  const [quantity, setQuantity] = useState<number>(1);

  // 각 기본 아이템(item.code)별 선택된 option_id 집합 - 초기값 설정
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, Set<number>>
  >(() => {
    const initial: Record<string, Set<number>> = {};
    dinner.default_items.forEach(di => {
      const itemCode = di.item.code;
      const optionSet = new Set<number>();

      // 각 옵션 그룹에 대해 min_select >= 1이면 첫 번째 옵션 자동 선택
      di.item.option_groups.forEach(group => {
        if (group.min_select >= 1 && group.options.length > 0) {
          optionSet.add(group.options[0].option_id);
        }
      });

      if (optionSet.size > 0) {
        initial[itemCode] = optionSet;
      }
    });
    return initial;
  });

  // 디너 레벨 옵션 선택 (option_id 집합) - 초기값 설정
  const [selectedDinnerOptions, setSelectedDinnerOptions] = useState<
    Set<number>
  >(() => {
    const initial = new Set<number>();

    // 각 디너 옵션 그룹에 대해 min_select >= 1이면 첫 번째 옵션 자동 선택
    dinner.option_groups.forEach(group => {
      if (group.min_select >= 1 && group.options.length > 0) {
        // is_default가 true인 옵션이 있으면 그것을 선택, 없으면 첫 번째 옵션
        const defaultOption = group.options.find(opt => opt.is_default);
        const selectedOption = defaultOption || group.options[0];
        initial.add(selectedOption.option_id);
      }
    });

    return initial;
  });

  // 선택된 스타일에 따른 최종 가격 계산
  // 스타일 적용 + 선택된 옵션들의 가격 delta 합산 후 100원 단위 반올림
  const finalPrice = (() => {
    const basePrice = dinner.dinner.base_price_cents;
    const selectedStyleObj = dinner.allowed_styles.find(
      s => s.code === selectedStyle,
    );

    let styledPrice = basePrice;
    if (selectedStyleObj) {
      if (selectedStyleObj.price_mode === 'multiplier') {
        styledPrice = Math.floor(basePrice * selectedStyleObj.price_value);
      } else {
        styledPrice = basePrice + selectedStyleObj.price_value;
      }
    }

    // per-item 옵션 가격 합산
    const itemOptionsDelta = Object.entries(selectedOptions).reduce(
      (acc, [itemCode, setIds]) => {
        if (setIds.size === 0) return acc;
        // 해당 item code로 기본아이템 찾기
        const di = dinner.default_items.find(it => it.item.code === itemCode);
        if (!di) return acc;
        return (
          acc +
          Array.from(setIds).reduce((oAcc, optionId) => {
            // item.option_groups 에서 optionId 찾아 delta 더하기
            const og = di.item.option_groups.find(g =>
              g.options.some(o => o.option_id === optionId),
            );
            if (!og) return oAcc;
            const opt = og.options.find(o => o.option_id === optionId);
            if (!opt) return oAcc;
            return oAcc + opt.price_delta_cents;
          }, 0)
        );
      },
      0,
    );

    // 디너 레벨 옵션 가격 합산
    const dinnerOptionsDelta = dinner.option_groups.reduce((acc, group) => {
      return (
        acc +
        group.options.reduce((gAcc, opt) => {
          return selectedDinnerOptions.has(opt.option_id)
            ? gAcc + opt.price_delta_cents
            : gAcc;
        }, 0)
      );
    }, 0);

    const priceWithOptions =
      styledPrice + itemOptionsDelta + dinnerOptionsDelta;
    return Math.round(priceWithOptions / 100) * 100;
  })();

  const toggleOption = (
    itemCode: string,
    groupId: number,
    optionId: number,
    selectMode: 'single' | 'multi',
    maxSelect: number,
    minSelect: number,
  ) => {
    setSelectedOptions(prev => {
      const current = new Set(prev[itemCode] ?? []);
      if (selectMode === 'single') {
        // 단일 선택: 이미 선택된 옵션을 다시 클릭하면 선택 해제 (minSelect === 0인 경우만)
        if (current.has(optionId)) {
          // 해당 그룹의 선택된 옵션 수 확인
          const di = dinner.default_items.find(it => it.item.code === itemCode);
          if (di) {
            const targetGroup = di.item.option_groups.find(
              g => g.group_id === groupId,
            );
            if (targetGroup) {
              const groupSelectedCount = targetGroup.options.filter(o =>
                current.has(o.option_id),
              ).length;
              // 그룹에 1개만 선택되어 있고 minSelect >= 1이면 선택 해제 불가
              if (groupSelectedCount === 1 && minSelect >= 1) {
                return { ...prev, [itemCode]: current };
              }
              // minSelect === 0이거나 다른 옵션도 선택되어 있으면 해제 가능
              targetGroup.options.forEach(o => current.delete(o.option_id));
            }
          }
          return { ...prev, [itemCode]: current };
        }
        // 다른 옵션 선택: 그룹 내 모든 옵션 제거 후 새 옵션 추가
        const di = dinner.default_items.find(it => it.item.code === itemCode);
        if (di) {
          const targetGroup = di.item.option_groups.find(
            g => g.group_id === groupId,
          );
          if (targetGroup) {
            targetGroup.options.forEach(o => current.delete(o.option_id));
          }
        }
        current.add(optionId);
      } else {
        // multi 인 경우 토글 + maxSelect 제한
        // 그룹 내 선택된 옵션 수 계산
        const di = dinner.default_items.find(it => it.item.code === itemCode);
        let groupSelectedCount = 0;
        if (di) {
          const targetGroup = di.item.option_groups.find(
            g => g.group_id === groupId,
          );
          if (targetGroup) {
            targetGroup.options.forEach(o => {
              if (current.has(o.option_id)) groupSelectedCount += 1;
            });
          }
        }

        if (current.has(optionId)) {
          // 최소 선택 수(minSelect) 유지 - 그룹별로 체크
          if (groupSelectedCount - 1 >= minSelect) {
            current.delete(optionId);
          }
        } else {
          // maxSelect 제한
          if (groupSelectedCount < maxSelect) {
            current.add(optionId);
          }
        }
      }
      return { ...prev, [itemCode]: current };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-xl text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <div className="space-y-6">
          {/* 디너 기본 정보 */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{dinner.dinner.name}</h2>
              <p className="text-muted-foreground mt-1">
                {dinner.dinner.description}
              </p>
            </div>
            <span className="text-primary text-2xl font-bold">
              {dinner.dinner.base_price_cents.toLocaleString()}원
            </span>
          </div>

          {/* 기본 제공 아이템 + 각 아이템별 옵션 그룹 */}
          {dinner.default_items.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">기본 제공 메뉴</h3>
              {dinner.default_items.map(defaultItem => (
                <div
                  key={defaultItem.item.item_id}
                  className="space-y-3 rounded border p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{defaultItem.item.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {defaultItem.item.description}
                      </div>
                    </div>
                    <div className="text-sm">
                      {defaultItem.default_qty}개
                      {defaultItem.included_in_base && (
                        <span className="text-primary ml-2">(기본 포함)</span>
                      )}
                    </div>
                  </div>
                  {/* 아이템 옵션 그룹 */}
                  {defaultItem.item.option_groups.length > 0 && (
                    <div className="space-y-3">
                      {defaultItem.item.option_groups.map(group => {
                        const itemCode = defaultItem.item.code;
                        const selectedSet =
                          selectedOptions[itemCode] || new Set();
                        // 그룹 내 선택된 옵션 수 계산
                        const groupSelectedCount = group.options.reduce(
                          (cnt, o) =>
                            selectedSet.has(o.option_id) ? cnt + 1 : cnt,
                          0,
                        );
                        return (
                          <div key={group.group_id} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                {group.name}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {group.select_mode === 'multi'
                                  ? `선택 ${groupSelectedCount}/${group.max_select}`
                                  : '1개 선택'}
                              </span>
                            </div>
                            <div className="grid gap-2">
                              {group.options.map(option => {
                                const checked = selectedSet.has(
                                  option.option_id,
                                );
                                const disabled =
                                  group.select_mode === 'multi' &&
                                  !checked &&
                                  groupSelectedCount >= group.max_select;
                                return (
                                  <label
                                    key={option.option_id}
                                    className={`flex cursor-pointer items-center justify-between rounded border p-2 text-sm ${
                                      disabled ? 'opacity-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type={
                                          group.select_mode === 'single' &&
                                          group.min_select >= 1
                                            ? 'radio'
                                            : 'checkbox'
                                        }
                                        name={`${itemCode}-group-${group.group_id}`}
                                        checked={checked}
                                        disabled={disabled}
                                        onChange={() =>
                                          toggleOption(
                                            itemCode,
                                            group.group_id,
                                            option.option_id,
                                            group.select_mode,
                                            group.max_select,
                                            group.min_select,
                                          )
                                        }
                                        className="h-4 w-4"
                                      />
                                      <span>{option.name}</span>
                                    </div>
                                    <span className="text-primary">
                                      +
                                      {option.price_delta_cents.toLocaleString()}
                                      원
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 디너 레벨 옵션 그룹 */}
          {dinner.option_groups.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">디너 옵션</h3>
              {dinner.option_groups.map(group => {
                const groupSelectedCount = group.options.reduce(
                  (cnt, o) =>
                    selectedDinnerOptions.has(o.option_id) ? cnt + 1 : cnt,
                  0,
                );
                return (
                  <div
                    key={group.group_id}
                    className="space-y-2 rounded border p-3"
                  >
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{group.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {group.select_mode === 'multi'
                          ? `선택 ${groupSelectedCount}/${group.max_select}`
                          : '1개 선택'}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {group.options.map(opt => {
                        const checked = selectedDinnerOptions.has(
                          opt.option_id,
                        );
                        const disabled =
                          group.select_mode === 'multi' &&
                          !checked &&
                          groupSelectedCount >= group.max_select;
                        return (
                          <label
                            key={opt.option_id}
                            className={`flex cursor-pointer items-center justify-between rounded border p-2 text-sm ${
                              disabled ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type={
                                  group.select_mode === 'single' &&
                                  group.min_select >= 1
                                    ? 'radio'
                                    : 'checkbox'
                                }
                                name={`dinner-group-${group.group_id}`}
                                checked={checked}
                                disabled={disabled}
                                onChange={() =>
                                  setSelectedDinnerOptions(prev => {
                                    const next = new Set(prev);
                                    if (group.select_mode === 'single') {
                                      // 이미 선택된 옵션을 다시 클릭: 선택 해제 (minSelect === 0인 경우만)
                                      if (checked) {
                                        if (group.min_select === 0) {
                                          group.options.forEach(o =>
                                            next.delete(o.option_id),
                                          );
                                        }
                                        // minSelect >= 1이면 선택 해제 불가
                                        return next;
                                      }
                                      // 다른 옵션 선택: 그룹 내 모든 옵션 제거 후 새 옵션 추가
                                      group.options.forEach(o =>
                                        next.delete(o.option_id),
                                      );
                                      next.add(opt.option_id);
                                    } else {
                                      if (checked) {
                                        // enforce min_select
                                        if (
                                          groupSelectedCount - 1 >=
                                          group.min_select
                                        ) {
                                          next.delete(opt.option_id);
                                        }
                                      } else {
                                        if (
                                          groupSelectedCount < group.max_select
                                        ) {
                                          next.add(opt.option_id);
                                        }
                                      }
                                    }
                                    return next;
                                  })
                                }
                                className="h-4 w-4"
                              />
                              <div className="flex flex-col">
                                <span>{opt.name}</span>
                                {opt.item_name && (
                                  <span className="text-muted-foreground text-xs">
                                    {opt.item_name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-primary">
                              +{opt.price_delta_cents.toLocaleString()}원
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* (이전) 디너 레벨 옵션 그룹은 per-item 옵션으로 대체됨 */}

          {/* 스타일 선택 */}
          {dinner.allowed_styles.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">스타일 선택</h3>
              <div className="grid gap-2">
                {dinner.allowed_styles.map(style => (
                  <div
                    key={style.style_id}
                    onClick={() => setSelectedStyle(style.code)}
                    className={`flex cursor-pointer items-center justify-between rounded p-2 ${
                      selectedStyle === style.code
                        ? 'border-primary bg-primary/5 border-2'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          selectedStyle === style.code
                            ? 'border-primary bg-primary'
                            : 'border-gray-400'
                        }`}
                      >
                        {selectedStyle === style.code && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{style.name}</div>
                        {style.notes && (
                          <div className="text-muted-foreground text-sm">
                            {style.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    {style.price_value !== 0 && (
                      <span className="text-primary">
                        {style.price_mode === 'delta' ? '+' : ''}
                        {style.price_value.toLocaleString()}원
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 최종 가격 표시 */}
          <div className="border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-lg font-semibold">수량</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded border px-3 py-1 hover:bg-gray-50"
                >
                  -
                </button>
                <span className="px-4 text-lg font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="rounded border px-3 py-1 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">최종 가격</span>
              <span className="text-primary text-2xl font-bold">
                {(finalPrice * quantity).toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded border px-4 py-2 hover:bg-gray-50"
            >
              닫기
            </button>
            <button
              onClick={() => {
                // DinnerDetail -> DinnerCart로 변환하여 store에 저장
                // 선택된 옵션을 items 배열로 변환
                const items = Object.entries(selectedOptions)
                  .filter(([, setIds]) => setIds.size > 0)
                  .map(([itemCode, setIds]) => {
                    const optionsArray = Array.from(setIds);
                    return {
                      code: itemCode,
                      qty: 0, // 차이값이므로 기본적으로 0
                      options: optionsArray,
                    };
                  });
                addEntryFromDinner({
                  dinner: {
                    dinner_type_id: dinner.dinner.dinner_type_id,
                    code: dinner.dinner.code,
                    name: dinner.dinner.name,
                    description: dinner.dinner.description,
                    base_price_cents: dinner.dinner.base_price_cents, // 원래 기본 가격 유지
                    style: selectedStyle, // 선택된 스타일 코드
                    dinner_options: Array.from(selectedDinnerOptions),
                  },
                  quantity: quantity,
                  default_items: dinner.default_items.map(di => ({
                    ...di,
                    default_qty: Math.floor(di.default_qty), // 정수 보장
                  })),
                  option_groups: dinner.option_groups,
                  allowed_styles: dinner.allowed_styles,
                  items,
                });
                navigate('/cart'); // 장바구니 페이지로 이동
              }}
              className="bg-primary hover:bg-primary/90 rounded px-6 py-2 text-white"
            >
              장바구니에 담기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
