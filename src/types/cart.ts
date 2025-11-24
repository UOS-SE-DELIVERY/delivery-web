import type { DefaultItem } from '@/types/dinner';
import type { DinnerDetail } from '@/types/dinner';
import type { OptionGroup } from '@/types/item';
// Reuse Style type via DinnerDetail.allowed_styles element type
type Style = DinnerDetail['allowed_styles'][number];

export interface DinnerCart {
  dinner: {
    dinner_type_id: number;
    code: string;
    name: string;
    description: string;
    base_price_cents: number;
    style?: string;
    dinner_options?: number[];
  };
  quantity: number;
  default_items: DefaultItem[];
  option_groups: OptionGroup[];
  // Persist allowed styles so we can recompute styled price in cart view
  allowed_styles?: Style[];
  items: {
    code: string;
    qty: number;
    options?: number[];
  }[];
}

export interface CartEntry {
  id: string;
  dinner: DinnerCart;
}
