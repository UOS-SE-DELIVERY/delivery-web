import { httpClient } from '@/api/mainInstance';
import type { CreateStaffCouponRequest, StaffCoupon } from '@/types/coupon';

export async function getStaffCouponsAPI() {
  return httpClient.get<StaffCoupon[]>('/staff/coupons');
}

export async function getStaffCouponAPI(code: string) {
  return httpClient.get<StaffCoupon>(`/staff/coupons/${code}`);
}

export async function postStaffCouponAPI(body: CreateStaffCouponRequest) {
  return httpClient.post<StaffCoupon>('/staff/coupons', body);
}

export async function deleteStaffCouponAPI(code: string) {
  return httpClient.delete<StaffCoupon>(`/staff/coupons/${code}`);
}
