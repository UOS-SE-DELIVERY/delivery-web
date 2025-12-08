import { httpClient } from '@/api/mainInstance';
import {
  OrderAddressMeta,
  OrderDinnerOption,
  OrderMeta,
  OrderResponse,
  OrderStatus,
} from '@/types/order';

export async function getStaffOrderAPI(orderId: number) {
  return httpClient.get<StaffOrderDetailResponse>(`/staff/orders/${orderId}`);
}

export async function executeOrderActionAPI(
  orderId: number,
  payload: ExecuteOrderActionPayload,
) {
  return httpClient.post<OrderResponse>(`/orders/${orderId}/action`, payload);
}

// Execute Order Action Types

export type OrderAction = Exclude<OrderStatus, 'pending'>;

export interface ExecuteOrderActionPayload {
  action: OrderAction;
}

// Staff Order Detail Response Types

export interface StaffOrderItemOption {
  id: number;
  option_group_name: string;
  option_name: string;
  price_delta_cents: number;
  multiplier: number | null;
}

export interface StaffOrderItem {
  id: number;
  item_code: string;
  item: {
    id: number;
    name: string | null;
  };
  final_qty: string;
  unit_price_cents: number;
  is_default: boolean;
  change_type: string;
  options: StaffOrderItemOption[];
}

export interface StaffOrderDinner {
  id: number;
  dinner_type: {
    id: number | null;
    code: string;
    name: string;
  };
  style: {
    id: number | null;
    code: string;
    name: string;
  };
  person_label: string | null;
  quantity: string;
  base_price_cents: number;
  style_adjust_cents: number;
  notes: string | null;
  items: StaffOrderItem[];
  options: OrderDinnerOption[];
}

export interface StaffOrderCoupon {
  coupon: string;
  amount_cents: number;
  channel: string;
  redeemed_at: string;
}

export interface StaffOrderMembership {
  customer_id: number;
  percent_off: number;
  active: boolean;
  valid_from: string;
  valid_until: string | null;
}

export interface StaffOrderDetailResponse {
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
  card_last4: string | null;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  meta: OrderMeta | null;
  dinners: StaffOrderDinner[];
  coupons: StaffOrderCoupon[];
  membership: StaffOrderMembership | null;
}
