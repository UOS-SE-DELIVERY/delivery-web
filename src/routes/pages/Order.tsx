import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';

import { getAuthMeAPI } from '@/api/auth/me/me.api';
import { postOrderAPI } from '@/api/order/order.api';
import { getStaffCouponAPI } from '@/api/staff/coupon.api';
import { DeliveryForm } from '@/components/order/DeliveryForm';
import { OrderAddressModal } from '@/components/order/OrderAddressModal';
import { OrderSummary } from '@/components/order/OrderSummary';
import useCartStore from '@/store/cartStore';
import type { CartEntry } from '@/types/cart';
import type { StaffCoupon } from '@/types/coupon';
import type { OrderDinner, OrderRequest } from '@/types/order';
import type { Profile, ProfileAddress } from '@/types/profile';
import { formatCurrency } from '@/utils/format';
import { calculateDinnerPrice } from '@/utils/orderPrice';

export function Order() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    entries?: CartEntry[];
    redirectTo?: string;
  } | null;

  const entries = state?.entries || [];

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 쿠폰 관련 상태
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupons, setAppliedCoupons] = useState<StaffCoupon[]>([]);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // 장바구니에서 엔트리 제거 액션
  const removeEntry = useCartStore(state => state.removeEntry);

  // 배송지 모달 및 선택 상태
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number | null>(
    null,
  );

  // react-hook-form 설정 및 타입
  type OrderFormValues = {
    receiverName: string;
    receiverPhone: string;
    deliveryAddress: string;
    placeLabel: string;
    geoLat: number;
    geoLng: number;
    addressNote: string;
    orderNote: string;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<OrderFormValues>({
    mode: 'onChange',
    defaultValues: {
      receiverName: '',
      receiverPhone: '',
      deliveryAddress: '',
      placeLabel: '',
      geoLat: 0,
      geoLng: 0,
      addressNote: '',
      orderNote: '',
    },
  });

  const buildOrderBody = (v: OrderFormValues): OrderRequest | null => {
    if (entries.length === 0 || !userProfile) return null;

    // 복수 디너 주문 처리
    const dinners = entries.map(entry => {
      const items = entry.dinner.items
        .filter(item => item.qty !== 0 || (item.options?.length ?? 0) > 0)
        .map(item => {
          // code에서 실제 아이템 코드만 추출 (형식: itemCode__opt_optionId)
          const actualCode = item.code.split('__opt_')[0];
          return {
            code: actualCode,
            qty: String(item.qty),
            options: item.options?.length ? item.options : undefined,
          };
        });

      const dinner: OrderDinner = {
        code: entry.dinner.dinner.code,
        quantity: String(entry.dinner.quantity),
        style: entry.dinner.dinner.style || 'default',
        dinner_options: entry.dinner.dinner.dinner_options?.length
          ? entry.dinner.dinner.dinner_options
          : undefined,
      };

      return {
        dinner,
        items,
      };
    });

    const body: OrderRequest = {
      customer_id: userProfile.customer_id,
      order_source: 'GUI',
      fulfillment_type: 'DELIVERY',
      dinners,
      receiver_name: v.receiverName,
      receiver_phone: v.receiverPhone,
      delivery_address: v.deliveryAddress,
      geo_lat: v.geoLat,
      geo_lng: v.geoLng,
      place_label: v.placeLabel,
      address_meta: { note: v.addressNote || undefined },
      payment_token: 'CARD_ON_DELIVERY',
      card_last4: '0000',
      meta: { note: v.orderNote || undefined },
      coupons:
        appliedCoupons.length > 0
          ? appliedCoupons.map(c => ({ code: c.code }))
          : undefined,
    };
    return body;
  };

  const onSubmit = async (values: OrderFormValues) => {
    if (!userProfile?.customer_id) {
      setErrorMsg('로그인이 필요합니다.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const body = buildOrderBody(values);
      if (!body) throw new Error('주문 정보를 만들 수 없습니다.');
      await postOrderAPI(body);
      // 주문 성공 시 모든 엔트리를 장바구니에서 제거
      entries.forEach(entry => {
        if (entry.id) {
          removeEntry(entry.id);
        }
      });
      navigate('/orders/me', { replace: true });
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } } | Error;
      const resp = (err as { response?: { data?: { message?: string } } })
        .response;
      const apiMessage = resp?.data?.message;
      const fallbackMessage = (err as Error).message;
      const msg = apiMessage || fallbackMessage || '주문에 실패했습니다.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await getAuthMeAPI();
        const profile = response.data as Profile;
        setUserProfile(profile);

        if (profile.profile_consent) {
          // 자동으로 내 정보 채우기
          if (profile.real_name)
            setValue('receiverName', profile.real_name, {
              shouldValidate: true,
            });
          if (profile.phone)
            setValue('receiverPhone', profile.phone, {
              shouldValidate: true,
            });

          // is_default가 true인 주소 찾기 (초기 선택)
          const defaultAddressIdx = profile.addresses?.findIndex(
            a => a.is_default,
          );
          if (
            defaultAddressIdx !== undefined &&
            defaultAddressIdx !== -1 &&
            profile.addresses
          ) {
            const defaultAddress = profile.addresses[defaultAddressIdx];
            setValue('deliveryAddress', defaultAddress.line, {
              shouldValidate: true,
            });
            setValue('placeLabel', defaultAddress.label, {
              shouldValidate: true,
            });
            setValue('geoLat', defaultAddress.lat, { shouldValidate: true });
            setValue('geoLng', defaultAddress.lng, { shouldValidate: true });
            setSelectedAddressIdx(defaultAddressIdx);
          }
        }
      } catch {
        // getAuthMeAPI 실패 시 별도의 처리 없이 무시합니다.
      }
    };
    loadUserProfile();
  }, [setValue]);

  // 배송지 선택 핸들러
  const handleSelectAddress = (address: ProfileAddress, idx: number) => {
    setValue('deliveryAddress', address.line, { shouldValidate: true });
    setValue('placeLabel', address.label, { shouldValidate: true });
    setValue('geoLat', address.lat, { shouldValidate: true });
    setValue('geoLng', address.lng, { shouldValidate: true });
    setSelectedAddressIdx(idx);
  };

  // 쿠폰 적용 핸들러
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('쿠폰 코드를 입력해주세요.');
      return;
    }

    // 이미 적용된 쿠폰인지 확인
    if (appliedCoupons.some(c => c.code === couponCode.trim())) {
      setCouponError('이미 적용된 쿠폰입니다.');
      return;
    }

    setCheckingCoupon(true);
    setCouponError(null);

    try {
      const response = await getStaffCouponAPI(couponCode.trim());
      const coupon = response.data;

      // 쿠폰 활성화 상태 확인
      if (!coupon.active) {
        setCouponError('사용할 수 없는 쿠폰입니다.');
        return;
      }

      // 쿠폰 유효기간 확인
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = coupon.valid_until
        ? new Date(coupon.valid_until)
        : null;

      if (now < validFrom) {
        setCouponError('아직 사용할 수 없는 쿠폰입니다.');
        return;
      }

      if (validUntil && now > validUntil) {
        setCouponError('유효기간이 만료된 쿠폰입니다.');
        return;
      }

      // 최소 주문 금액 확인
      const subtotal = entries.reduce((sum, entry) => {
        const { total } = calculateDinnerPrice(entry.dinner);
        return sum + total;
      }, 0);

      if (coupon.min_subtotal_cents > subtotal) {
        setCouponError(
          `최소 주문 금액 ${formatCurrency(coupon.min_subtotal_cents)}이상부터 사용 가능합니다.`,
        );
        return;
      }

      setAppliedCoupons([...appliedCoupons, coupon]);
      setCouponCode('');
      setCouponError(null);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } } | Error;
      const resp = (err as { response?: { data?: { message?: string } } })
        .response;
      const apiMessage = resp?.data?.message;
      const fallbackMessage = (err as Error).message;
      const msg = apiMessage || fallbackMessage || '유효하지 않은 쿠폰입니다.';
      setCouponError(msg);
    } finally {
      setCheckingCoupon(false);
    }
  };

  // 쿠폰 제거 핸들러
  const handleRemoveCoupon = (code: string) => {
    setAppliedCoupons(appliedCoupons.filter(c => c.code !== code));
  };

  // 쿠폰 할인 계산
  const calculateCouponDiscount = () => {
    const subtotal = entries.reduce((sum, entry) => {
      const { total } = calculateDinnerPrice(entry.dinner);
      return sum + total;
    }, 0);

    let totalDiscount = 0;
    appliedCoupons.forEach(coupon => {
      let discount = 0;
      if (coupon.kind === 'percent') {
        discount = Math.floor((subtotal * coupon.value) / 100);
      } else {
        discount = coupon.value;
      }

      if (
        coupon.max_discount_cents > 0 &&
        discount > coupon.max_discount_cents
      ) {
        discount = coupon.max_discount_cents;
      }

      totalDiscount += discount;
    });

    return totalDiscount;
  };

  if (entries.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="mb-2 text-2xl font-bold">주문</h1>
        <p className="text-muted-foreground mb-4">
          주문할 디너 정보가 없습니다.
        </p>
        <button
          onClick={() => navigate('/cart')}
          className="rounded border px-4 py-2 hover:bg-gray-50"
        >
          장바구니로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">주문 확인</h1>
      {errorMsg && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 여러 디너 요약 표시 */}
      <div className="mb-6 space-y-3">
        {entries.map((entry, idx) => (
          <OrderSummary key={entry.id || idx} dinner={entry.dinner} />
        ))}

        {/* 전체 합산 가격 (디너가 2개 이상일 때만 표시) */}
        {entries.length > 1 && (
          <div className="border-primary bg-primary/5 rounded-lg border-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">전체 합계</span>
              <span className="text-primary text-2xl font-bold">
                {formatCurrency(
                  entries.reduce((sum, entry) => {
                    const { total } = calculateDinnerPrice(entry.dinner);
                    return sum + total;
                  }, 0),
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 쿠폰 입력 섹션 */}
      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">쿠폰</h2>

        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={e => {
              setCouponCode(e.target.value);
              setCouponError(null);
            }}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyCoupon();
              }
            }}
            placeholder="쿠폰 코드 입력"
            className="flex-1 rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
            disabled={checkingCoupon}
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={checkingCoupon || !couponCode.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            {checkingCoupon ? '확인중...' : '적용'}
          </button>
        </div>

        {couponError && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {couponError}
          </div>
        )}

        {appliedCoupons.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">적용된 쿠폰</p>
            {appliedCoupons.map(coupon => {
              const subtotal = entries.reduce((sum, entry) => {
                const { total } = calculateDinnerPrice(entry.dinner);
                return sum + total;
              }, 0);

              let discount = 0;
              if (coupon.kind === 'percent') {
                discount = Math.floor((subtotal * coupon.value) / 100);
              } else {
                discount = coupon.value;
              }

              if (
                coupon.max_discount_cents > 0 &&
                discount > coupon.max_discount_cents
              ) {
                discount = coupon.max_discount_cents;
              }

              return (
                <div
                  key={coupon.code}
                  className="flex items-center justify-between rounded border bg-green-50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-gray-900">{coupon.name}</p>
                    <p className="text-sm text-gray-600">
                      {coupon.kind === 'percent'
                        ? `${coupon.value}% 할인`
                        : `${formatCurrency(coupon.value)} 할인`}
                      {' · '}
                      <span className="font-medium text-green-700">
                        -{formatCurrency(discount)}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCoupon(coupon.code)}
                    className="text-red-600 hover:text-red-800"
                  >
                    제거
                  </button>
                </div>
              );
            })}

            {/* 총 할인 금액 */}
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-semibold text-gray-900">쿠폰 할인</span>
              <span className="text-lg font-bold text-green-600">
                -{formatCurrency(calculateCouponDiscount())}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 최종 결제 금액 */}
      {appliedCoupons.length > 0 && (
        <div className="mb-6 rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">최종 결제 금액</span>
            <span className="text-2xl font-bold text-blue-700">
              {formatCurrency(
                entries.reduce((sum, entry) => {
                  const { total } = calculateDinnerPrice(entry.dinner);
                  return sum + total;
                }, 0) - calculateCouponDiscount(),
              )}
            </span>
          </div>
        </div>
      )}

      <DeliveryForm
        register={register}
        errors={errors}
        watch={watch}
        userProfile={userProfile}
        selectedAddressIdx={selectedAddressIdx}
        setIsAddressModalOpen={setIsAddressModalOpen}
        onSubmit={handleSubmit(onSubmit)}
        submitting={submitting}
        isValid={isValid}
        hasEntry={entries.length > 0}
      />

      {/* 배송지 선택 모달 */}
      <OrderAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelectAddress={handleSelectAddress}
        currentSelectedIdx={selectedAddressIdx}
      />
    </div>
  );
}
