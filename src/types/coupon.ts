export interface StaffCoupon {
  code: string;
  name: string;
  label: string;
  active: boolean;
  kind: 'percent' | 'fixed';
  value: number;
  valid_from: string;
  valid_until: string | null;
  min_subtotal_cents: number;
  max_discount_cents: number;
  stackable_with_membership: boolean;
  stackable_with_coupons: boolean;
  channel: string;
  max_redemptions_global: number | null;
  max_redemptions_per_user: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffCouponRequest {
  code: string;
  name: string;
  label: string;
  active: boolean;
  kind: 'percent' | 'fixed';
  value: number;
  valid_from: string | null;
  valid_until: string | null;
  min_subtotal_cents: number | null;
  max_discount_cents: number | null;
  stackable_with_membership: boolean;
  stackable_with_coupons: boolean;
  channel: string;
  max_redemptions_global: number | null;
  max_redemptions_per_user: number | null;
  notes: string;
}
