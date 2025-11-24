interface ItemCategory {
  category_id: number;
  name: string;
  slug: string;
}

export interface Option {
  option_id: number;
  name: string;
  price_delta_cents: number;
  multiplier: string;
  rank: number;
  // Dinner-specific fields (optional)
  item_code?: string;
  item_name?: string;
  is_default?: boolean;
}

export interface OptionGroup {
  group_id: number;
  name: string;
  select_mode: 'multi' | 'single';
  min_select: number;
  max_select: number;
  is_required: boolean;
  is_variant?: boolean; // Item-specific field
  price_mode: string;
  rank: number;
  options: Option[];
}

export interface ItemDetail {
  item_id: number;
  code: string;
  name: string;
  description: string;
  base_price_cents: number;
  active: boolean;
  category: ItemCategory;
  option_groups: OptionGroup[];
}
