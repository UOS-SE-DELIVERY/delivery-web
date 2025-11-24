import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { loginAPI, LoginPayload } from '@/api/auth/auth.api';
import { useAuthStore } from '@/store/authStore';

export function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginPayload>({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const isLogin = useAuthStore(state => state.isLogin);

  // 이미 로그인된 사용자가 로그인 페이지 접근 시 catalog로 이동
  useEffect(() => {
    if (isLogin) {
      navigate('/catalog', { replace: true });
    }
  }, [isLogin, navigate]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginAPI(form);
      // 클라이언트 상태 업데이트
      useAuthStore.getState().storeLogin();
      // 로그인 후에는 catalog로 이동 (요구사항에 따라 우선순위 변경)
      navigate('/catalog', { replace: true });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;

      setError(errorMessage || '로그인에 실패했습니다.');
      console.error('login error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="bg-card outline-border animate-fade-in mb-6 rounded-xl p-8 shadow-lg outline">
        <h1 className="mb-2 text-center text-3xl font-bold">로그인</h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          최고의 만찬 서비스를 이용하시려면 로그인해주세요
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">아이디</label>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              className="border-border bg-popover focus:border-primary focus:ring-primary/20 w-full rounded-md border p-2.5 focus:ring-2 focus:outline-none"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">비밀번호</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              onKeyDown={handleKeyEvent}
              onKeyUp={handleKeyEvent}
              className="border-border bg-popover focus:border-primary focus:ring-primary/20 w-full rounded-md border p-2.5 focus:ring-2 focus:outline-none"
              placeholder="비밀번호를 입력하세요"
              required
            />
            {capsLockOn && (
              <p className="mt-1 text-xs text-yellow-600">
                ⚠️ Caps Lock이 켜져 있습니다
              </p>
            )}
          </div>

          {error && (
            <div className="text-destructive rounded-md bg-red-50 p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="bg-primary text-primary-foreground w-full rounded-md p-2.5 font-semibold transition-colors hover:opacity-90 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-gray-700 transition-colors hover:bg-gray-50"
          >
            홈으로 가기
          </button>

          <div className="text-muted-foreground border-t pt-4 text-center text-sm">
            계정이 없으신가요?{' '}
            <button
              type="button"
              onClick={() => navigate('/join')}
              className="text-primary font-medium underline hover:no-underline"
            >
              회원가입
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
