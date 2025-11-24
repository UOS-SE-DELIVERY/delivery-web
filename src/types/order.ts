// Order API request body types

export interface OrderDinner {
  code: string;
  quantity: string;
  style: string;
  dinner_options?: number[];
}

export interface OrderItem {
  code: string;
  qty: string;
  options?: number[];
}

export interface OrderCoupon {
  code: string;
}

export interface OrderAddressMeta {
  note?: string;
}

export interface OrderMeta {
  note?: string;
}

export interface OrderRequest {
  customer_id: number;
  order_source: string;
  fulfillment_type: string;
  dinner: OrderDinner;
  items: OrderItem[];
  receiver_name: string;
  receiver_phone: string;
  delivery_address: string;
  geo_lat: number;
  geo_lng: number;
  place_label: string;
  address_meta: OrderAddressMeta;
  payment_token: string;
  card_last4: string;
  meta: OrderMeta;
  coupons?: OrderCoupon[];
}

// Order API response types

// Note: change_type is an arbitrary string from server; do not narrow here.

export interface OrderItemOption {
  id: number;
  option_group_name: string;
  option_name: string;
  price_delta_cents: number;
}

export interface OrderResponseItem {
  id: number;
  item_code: string;
  item_name: string;
  final_qty: string;
  unit_price_cents: number;
  is_default: boolean;
  change_type: string;
  options: OrderItemOption[];
}

export interface OrderDinnerOption {
  id: number;
  option_group_name: string;
  option_name: string;
  price_delta_cents: number;
}

export interface OrderResponseDinner {
  id: number;
  dinner_code: string;
  dinner_name: string;
  style_code: string;
  style_name: string;
  person_label: string | null;
  quantity: string;
  base_price_cents: number;
  style_adjust_cents: number;
  notes: string | null;
  items: OrderResponseItem[];
  options: OrderDinnerOption[];
}

export interface OrderResponse {
  id: number;
  customer_id: number;
  ordered_at: string;
  status: string;
  order_source: string;
  receiver_name: string | null;
  receiver_phone: string | null;
  delivery_address: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  place_label: string | null;
  address_meta: OrderAddressMeta | null;
  payment_token: string | null;
  card_last4: string | null;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  meta: OrderMeta | null;
  dinners: OrderResponseDinner[];
}
