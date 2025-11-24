import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';

import { getAuthMeAPI } from '@/api/auth/me/me.api';
import { postOrderAPI } from '@/api/order/order.api';
import { DeliveryForm } from '@/components/order/DeliveryForm';
import { OrderAddressModal } from '@/components/order/OrderAddressModal';
import { OrderSummary } from '@/components/order/OrderSummary';
import useCartStore from '@/store/cartStore';
import type { CartEntry } from '@/types/cart';
import type { OrderRequest } from '@/types/order';
import type { Profile, ProfileAddress } from '@/types/profile';

export function Order() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    entry?: CartEntry;
    redirectTo?: string;
  } | null;
  const entry = state?.entry;

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (!entry || !userProfile) return null;

    // items는 entry.dinner.items를 그대로 전송
    // (이미 추가/감소된 수량으로 저장되어 있음)
    const items = entry.dinner.items
      .filter(item => item.qty !== 0 || (item.options?.length ?? 0) > 0)
      .map(item => ({
        code: item.code,
        qty: String(item.qty),
        options: item.options?.length ? item.options : undefined,
      }));

    const body: OrderRequest = {
      customer_id: userProfile.customer_id,
      order_source: 'GUI',
      fulfillment_type: 'DELIVERY',
      dinner: {
        code: entry.dinner.dinner.code,
        quantity: String(entry.dinner.quantity),
        style: entry.dinner.dinner.style || 'default',
        dinner_options: entry.dinner.dinner.dinner_options?.length
          ? entry.dinner.dinner.dinner_options
          : undefined,
      },
      items,
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
      // 주문 성공 시 현재 엔트리를 장바구니에서 제거
      if (entry?.id) {
        removeEntry(entry.id);
      }
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

  if (!entry) {
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
      <OrderSummary dinner={entry.dinner} />

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
        hasEntry={!!entry}
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
