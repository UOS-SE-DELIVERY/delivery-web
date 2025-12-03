import type {
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from 'react-hook-form';
import { useNavigate } from 'react-router';

import type { Profile } from '@/types/profile';

interface FormInputs {
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  placeLabel: string;
  geoLat: number;
  geoLng: number;
  addressNote: string;
  orderNote: string;
}

interface DeliveryFormProps {
  register: UseFormRegister<FormInputs>;
  errors: FieldErrors<FormInputs>;
  watch: UseFormWatch<FormInputs>;
  userProfile: Profile | null;
  selectedAddressIdx: number | null;
  setIsAddressModalOpen: (open: boolean) => void;
  onSubmit: () => void;
  submitting: boolean;
  isValid: boolean;
  hasEntry: boolean;
}

export function DeliveryForm({
  register,
  errors,
  watch,
  userProfile,
  selectedAddressIdx,
  setIsAddressModalOpen,
  onSubmit,
  submitting,
  isValid,
  hasEntry,
}: DeliveryFormProps) {
  const navigate = useNavigate();
  const placeLabel = watch('placeLabel');

  return (
    <form className="mt-4 rounded-lg border bg-white p-6" onSubmit={onSubmit}>
      <h2 className="mb-4 text-lg font-semibold">배송 정보</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            받는 사람 이름
          </label>
          <input
            type="text"
            placeholder="이름을 입력하세요"
            className="w-full rounded border px-3 py-2 text-sm"
            {...register('receiverName', {
              required: '이름을 입력해주세요.',
            })}
          />
          {errors.receiverName && (
            <p className="mt-1 text-xs text-red-600">
              {errors.receiverName.message}
            </p>
          )}
          {userProfile?.profile_consent && (
            <p className="text-muted-foreground mt-1 text-xs">
              프로필 동의로 자동 입력됨
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            받는 사람 전화번호
          </label>
          <input
            type="tel"
            placeholder="010-0000-0000"
            className="w-full rounded border px-3 py-2 text-sm"
            inputMode="numeric"
            title="전화번호는 000-0000-0000 형식으로 입력하세요"
            {...register('receiverPhone', {
              required: '전화번호를 입력해주세요.',
              pattern: {
                value: /^\d{3}-\d{4}-\d{4}$/,
                message: '전화번호 형식은 000-0000-0000 이어야 합니다.',
              },
            })}
          />
          {errors.receiverPhone && (
            <p className="mt-1 text-xs text-red-600">
              {errors.receiverPhone.message}
            </p>
          )}
          {userProfile?.profile_consent && (
            <p className="text-muted-foreground mt-1 text-xs">
              프로필 동의로 자동 입력됨
            </p>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium">배송지</label>
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(true)}
              className="text-primary hover:text-primary/80 text-xs"
            >
              주소 선택/변경
            </button>
          </div>
          <input
            type="text"
            placeholder="주소를 입력하세요"
            className="w-full rounded border px-3 py-2 text-sm"
            {...register('deliveryAddress', {
              required: '주소를 입력해주세요.',
            })}
          />
          {errors.deliveryAddress && (
            <p className="mt-1 text-xs text-red-600">
              {errors.deliveryAddress.message}
            </p>
          )}
          {/* 선택된 라벨/좌표 요약 메시지 제거 */}
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium">장소 라벨</label>
            <input
              type="text"
              placeholder="집, 회사 등"
              className="w-full rounded border px-3 py-2 text-sm"
              {...register('placeLabel')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">위도</label>
            <input
              type="number"
              step="0.000001"
              placeholder="37.566"
              className="w-full rounded border px-3 py-2 text-sm"
              {...register('geoLat', {
                valueAsNumber: true,
                validate: v => !Number.isNaN(v) || '위도를 입력해주세요.',
              })}
            />
            {errors.geoLat && (
              <p className="mt-1 text-xs text-red-600">
                {errors.geoLat.message as string}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">경도</label>
            <input
              type="number"
              step="0.000001"
              placeholder="126.978"
              className="w-full rounded border px-3 py-2 text-sm"
              {...register('geoLng', {
                valueAsNumber: true,
                validate: v => !Number.isNaN(v) || '경도를 입력해주세요.',
              })}
            />
            {errors.geoLng && (
              <p className="mt-1 text-xs text-red-600">
                {errors.geoLng.message as string}
              </p>
            )}
          </div>
        </div>

        {/* 장소 라벨 입력은 배송지 아래로 이동 */}

        <div>
          <label className="mb-1 block text-sm font-medium">
            배송 메모 (선택)
          </label>
          <input
            type="text"
            placeholder="경비실 맡김, 문 앞에 놓아주세요 등"
            className="w-full rounded border px-3 py-2 text-sm"
            {...register('addressNote')}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            주문 메모 (선택)
          </label>
          <textarea
            placeholder="요청사항을 입력하세요"
            className="w-full rounded border px-3 py-2 text-sm"
            rows={3}
            {...register('orderNote')}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="rounded border px-4 py-2 hover:bg-gray-50"
        >
          뒤로
        </button>
        <button
          type="submit"
          disabled={
            submitting || !isValid || !hasEntry || !userProfile?.customer_id
          }
          className={`rounded px-6 py-2 text-white ${
            submitting || !isValid || !hasEntry || !userProfile?.customer_id
              ? 'cursor-not-allowed bg-gray-400'
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {submitting ? '처리 중…' : '주문 확정'}
        </button>
      </div>
    </form>
  );
}
