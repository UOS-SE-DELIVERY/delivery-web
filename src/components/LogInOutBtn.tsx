import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { logoutAPI } from '@/api/auth/auth.api';
import { useAuthStore } from '@/store/authStore';

export function LogInOutBtn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = useAuthStore(state => state.isLogin);

  const onLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      await logoutAPI();
      // 클라이언트 상태 초기화
      useAuthStore.getState().storeLogout();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      setError(message || '로그아웃에 실패했습니다.');
      console.error('logout error', err);
    } finally {
      setLoading(false);
    }
  };

  const onLogin = () => {
    // 현재 페이지 경로를 state로 전달
    navigate('/login', { state: { from: location } });
  };

  return (
    <div className="flex items-center justify-end">
      {isLogin ? (
        <div className="flex flex-col items-center">
          <button
            onClick={onLogout}
            disabled={loading}
            className="bg-destructive text-destructive-foreground rounded-md px-3 py-1 text-sm disabled:opacity-60"
          >
            {loading ? '로그아웃...' : '로그아웃'}
          </button>
          {error && (
            <div className="text-destructive mt-2 text-sm">{error}</div>
          )}
        </div>
      ) : (
        <button
          onClick={onLogin}
          className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-sm"
        >
          로그인
        </button>
      )}
    </div>
  );
}
