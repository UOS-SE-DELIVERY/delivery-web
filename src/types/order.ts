// Order API request body types

export interface DefaultOverride {
  code: string;
  qty: string;
}

export interface OrderDinner {
  code: string;
  quantity: string;
  style: string;
  dinner_options?: number[];
  default_overrides?: DefaultOverride[];
}

export interface OrderDinnerGroup {
  dinner: OrderDinner;
  items: OrderItem[];
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
  dinners?: OrderDinnerGroup[];
  dinner?: OrderDinner;
  items?: OrderItem[];
  receiver_name: string;
  receiver_phone: string;
  delivery_address: string;
  geo_lat?: number;
  geo_lng?: number;
  place_label?: string;
  address_meta?: OrderAddressMeta;
  payment_token?: string;
  card_last4?: string;
  meta?: OrderMeta;
  coupons?: OrderCoupon[];
}

export interface UpdateOrderRequest {
  receiver_name?: string | null;
  receiver_phone?: string | null;
  delivery_address?: string | null;
  geo_lat?: number | null;
  geo_lng?: number | null;
  place_label?: string | null;
  address_meta?: OrderAddressMeta | null;
  payment_token?: string | null;
  card_last4?: string | null;
  meta?: OrderMeta | null;
  coupons?: OrderCoupon[];
  dinners?: OrderDinnerGroup[];
  dinner?: OrderDinner;
  items?: OrderItem[];
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
  status: OrderStatus;
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

// Order status utilities

export type OrderStatus =
  | 'pending'
  | 'accept'
  | 'preparing'
  | 'mark-ready'
  | 'ready'
  | 'out_for_delivery'
  | 'dispatch'
  | 'out'
  | 'deliver'
  | 'delivered'
  | 'cancel';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '대기중',
  accept: '접수',
  preparing: '준비중',
  'mark-ready': '준비완료',
  ready: '배달대기',
  out_for_delivery: '배달출발',
  dispatch: '배차완료',
  out: '기사 전달',
  deliver: '배달진행',
  delivered: '배달완료',
  cancel: '취소',
};

export const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accept: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  'mark-ready': 'bg-green-100 text-green-800',
  ready: 'bg-green-200 text-green-900',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  dispatch: 'bg-violet-100 text-violet-800',
  out: 'bg-purple-200 text-purple-900',
  deliver: 'bg-fuchsia-100 text-fuchsia-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancel: 'bg-red-100 text-red-800',
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function getOrderStatusBadgeClass(status: OrderStatus): string {
  return ORDER_STATUS_BADGE_CLASSES[status] ?? 'bg-gray-100 text-gray-800';
}
