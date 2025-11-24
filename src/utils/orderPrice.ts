import type { DinnerCart } from '@/types/cart';

/**
 * 카트 디너 엔트리의 최종 가격을 계산합니다.
 * 기본 가격 + 스타일 변경 + 디너 옵션 + 아이템 옵션을 모두 반영합니다.
 */
export function calculateDinnerPrice(dinner: DinnerCart): {
  basePrice: number;
  styledPrice: number;
  itemOptionsDelta: number;
  dinnerOptionsDelta: number;
  finalPriceRounded: number;
  total: number;
} {
  const basePrice = dinner.dinner.base_price_cents;
  let styledPrice = basePrice;

  // 스타일 가격 계산
  if (dinner.allowed_styles && dinner.dinner.style) {
    const styleObj = dinner.allowed_styles.find(
      s => s.code === dinner.dinner.style,
    );
    if (styleObj) {
      if (styleObj.price_mode === 'multiplier') {
        styledPrice = Math.floor(basePrice * styleObj.price_value);
      } else {
        styledPrice = basePrice + styleObj.price_value;
      }
    }
  }

  // 아이템별 옵션 delta 합산
  const itemOptionsDelta = (dinner.items || []).reduce((acc, it) => {
    if (!it.options || it.options.length === 0) return acc;
    const itemCode = it.code.split('__opt_')[0];
    const matchedItem = dinner.default_items.find(
      di => di.item.code === itemCode,
    );
    if (!matchedItem) return acc;

    const deltaSum = it.options.reduce((oAcc, optionId) => {
      for (const og of matchedItem.item.option_groups) {
        const opt = og.options.find(o => o.option_id === optionId);
        if (opt) return oAcc + opt.price_delta_cents;
      }
      return oAcc;
    }, 0);
    return acc + deltaSum;
  }, 0);

  // 디너 레벨 옵션 delta 합산
  const dinnerOptionsDelta = (dinner.option_groups || []).reduce(
    (acc, group) => {
      return (
        acc +
        group.options.reduce((gAcc, opt) => {
          return dinner.dinner.dinner_options?.includes(opt.option_id)
            ? gAcc + opt.price_delta_cents
            : gAcc;
        }, 0)
      );
    },
    0,
  );

  const priceWithOptions = styledPrice + itemOptionsDelta + dinnerOptionsDelta;
  const finalPriceRounded = Math.round(priceWithOptions / 100) * 100;
  const total = finalPriceRounded * dinner.quantity;

  return {
    basePrice,
    styledPrice,
    itemOptionsDelta,
    dinnerOptionsDelta,
    finalPriceRounded,
    total,
  };
}
