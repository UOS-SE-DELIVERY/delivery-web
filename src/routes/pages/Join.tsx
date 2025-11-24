/* eslint-disable prettier/prettier */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { JoinAPI } from '@/api/auth/auth.api';
import { useAuthStore } from '@/store/authStore';

interface JoinFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  real_name: string;
  phone: string;
  profile_consent: boolean;
  // 세부 주소 필드 (동의한 경우에만 입력 가능)
  address_label: string;
  address_line: string;
  address_lat: number;
  address_lng: number;
}

export function Join() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<JoinFormValues>({
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      real_name: '',
      phone: '',
      profile_consent: false,
      address_label: '',
      address_line: '',
      address_lat: 0,
      address_lng: 0,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLogin = useAuthStore(state => state.isLogin);

  // 이미 로그인된 사용자가 회원가입 페이지 접근 시 catalog로 이동
  useEffect(() => {
    if (isLogin) {
      navigate('/catalog', { replace: true });
    }
  }, [isLogin, navigate]);

  const password = watch('password');
  const consent = watch('profile_consent');

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const onSubmit = async (data: JoinFormValues) => {
    setError(null);
    setLoading(true);

    try {
      // 동의한 경우에만 주소 객체 구성. label이 비어있으면 '기본'으로 대체.
      type Payload = {
        username: string;
        password: string;
        profile_consent: boolean;
        real_name?: string;
        phone?: string;
        address?: {
          label: string;
          line: string;
          lat: number;
          lng: number;
        };
      };

      const payload: Payload = {
        username: data.username,
        password: data.password,
        profile_consent: data.profile_consent,
      };

      if (data.profile_consent) {
        if (data.real_name) payload.real_name = data.real_name;
        if (data.phone) payload.phone = data.phone;
        if (data.address_line) {
          payload.address = {
            label: data.address_label || '기본',
            line: data.address_line,
            lat: data.address_lat,
            lng: data.address_lng,
          };
        }
      }

      await JoinAPI(payload);

      // 성공 시 로그인 페이지로 이동 (state 전달 롤백)
      navigate('/login');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;

      setError(message || '회원가입에 실패했습니다.');

      console.error('join error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="bg-card outline-border animate-fade-in mb-8 rounded-xl p-6 shadow-lg outline">
        <h1 className="mb-4 text-center text-4xl font-bold">회원가입</h1>
        <p className="text-muted-foreground mb-6 text-center text-lg">
          새로운 계정을 만들어 최고의 만찬 서비스를 경험해보세요!
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-secondary-foreground mb-2 text-xl font-semibold">
          회원가입 양식
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              아이디
            </label>
            <input
              id="username"
              {...register('username', { required: '아이디를 입력해주세요.' })}
              className="border-muted-foreground bg-popover mt-1 block w-full rounded-md border p-2"
            />
            {errors.username && (
              <p className="text-destructive mt-1 text-sm">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              {...register('password', {
                required: '비밀번호를 입력해주세요.',
                minLength: {
                  value: 6,
                  message: '비밀번호는 최소 6자 이상이어야 합니다.',
                },
              })}
              className="border-muted-foreground bg-popover mt-1 block w-full rounded-md border p-2"
            />
            {errors.password && (
              <p className="text-destructive mt-1 text-sm">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium"
            >
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword', {
                required: '비밀번호 확인을 입력해주세요.',
                validate: value =>
                  value === password || '비밀번호가 일치하지 않습니다.',
              })}
              className="border-muted-foreground bg-popover mt-1 block w-full rounded-md border p-2"
            />
            {errors.confirmPassword && (
              <p className="text-destructive mt-1 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* 동의 여부 먼저 배치 */}
          <div className="rounded-md border border-gray-300 bg-gray-50 p-4">
            <div className="flex items-start space-x-3">
              <input
                id="profile_consent"
                type="checkbox"
                {...register('profile_consent')}
                className="mt-1 h-4 w-4 cursor-pointer"
              />
              <label
                htmlFor="profile_consent"
                className="cursor-pointer text-sm leading-relaxed"
              >
                <span className="font-medium text-gray-900">
                  프로필 정보 사용에 동의합니다.
                </span>
                <p className="mt-1 text-xs text-gray-600">
                  회원가입 시 입력하신 프로필 정보(이름, 전화번호, 주소)를 주문
                  시 자동으로 사용할 수 있습니다.
                </p>
                <p className="mt-2 text-xs font-medium text-gray-700">
                  {!consent
                    ? '동의하지 않으면 이름/전화번호/주소는 저장되지 않습니다.'
                    : '동의하셨습니다. 프로필 정보가 주문 시 자동 입력됩니다.'}
                </p>
              </label>
            </div>
          </div>

          {/* 프로필 정보 (동의한 경우에만 표시) */}
          {consent && (
            <div className="rounded-md border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-semibold">프로필 정보</h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="real_name"
                    className="block text-sm font-medium"
                  >
                    이름
                  </label>
                  <input
                    id="real_name"
                    {...register('real_name')}
                    className="border-muted-foreground bg-popover mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium">
                    전화번호
                  </label>
                  <input
                    id="phone"
                    placeholder="010-1234-5678"
                    {...register('phone', {
                      pattern: {
                        value: /^\d{3}-\d{4}-\d{4}$/,
                        message: '전화번호는 000-0000-0000 형식이어야 합니다.',
                      },
                      onChange: e => {
                        const formatted = formatPhoneNumber(e.target.value);
                        e.target.value = formatted;
                      },
                    })}
                    className="border-muted-foreground bg-popover mt-1 block w-full rounded-md border p-2"
                  />
                  {errors.phone && (
                    <p className="text-destructive mt-1 text-sm">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* 주소 상세 */}
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      배송지 이름
                    </label>
                    <input
                      type="text"
                      {...register('address_label')}
                      placeholder="예: 우리집, 회사"
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      주소
                    </label>
                    <input
                      type="text"
                      {...register('address_line')}
                      placeholder="서울 OO구 OO로 12"
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        위도
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        {...register('address_lat', { valueAsNumber: true })}
                        placeholder="37.57"
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        경도
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        {...register('address_lng', { valueAsNumber: true })}
                        placeholder="126.98"
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  {/* 첫 번째 주소는 자동으로 기본 배송지로 처리됨 */}
                </div>
              </div>
            </div>
          )}

          {error && <div className="text-destructive text-sm">{error}</div>}

          <button
            type="submit"
            className="bg-primary text-primary-foreground w-full rounded-md p-2"
            disabled={loading}
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
          >
            홈으로 가기
          </button>
        </form>
      </section>
    </main>
  );
}
