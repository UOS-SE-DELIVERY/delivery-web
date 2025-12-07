import type { ItemDetail, OptionGroup } from './item';

interface Category {
  category_id: number;
  name: string;
  slug: string;
  rank: number;
  active: boolean;
  children: Category[];
}

interface Tag {
  tag_id: number;
  name: string;
}

export interface CatalogDinner {
  dinner_type_id: number;
  code: string;
  name: string;
  description: string;
  base_price_cents: number;
  active: boolean;
}

export interface CatalogResponse {
  categories: Category[];
  tags: Tag[];
  dinners: CatalogDinner[];
}

export interface DefaultItem {
  item: ItemDetail;
  default_qty: number;
  included_in_base: boolean;
  notes: string | null;
}

interface Style {
  style_id: number;
  code: string;
  name: string;
  price_mode: string;
  price_value: number;
  notes: string | null;
}

export interface DinnerDetail {
  dinner: {
    dinner_type_id: number;
    code: string;
    name: string;
    description: string;
    base_price_cents: number;
    active: boolean;
  };
  default_items: DefaultItem[];
  allowed_styles: Style[];
  option_groups: OptionGroup[];
}
