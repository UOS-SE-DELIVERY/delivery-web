import axios from 'axios';
import { useNavigate } from 'react-router';

import { logoutAPI } from '@/api/auth/auth.api';

/**
 * 인증 에러를 처리하는 훅
 * 401: 로그인 필요 -> /login으로 리다이렉트
 * 403: 권한 없음/토큰 만료 -> 로그아웃 후 /login으로 리다이렉트
 */
export function useAuthErrorHandler() {
  const navigate = useNavigate();

  const handleAuthError = async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const status = error.response?.status;

    // 401: 인증 필요
    if (status === 401) {
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
      throw error;
    }

    // 403: 권한 없음/토큰 만료
    if (status === 403) {
      try {
        await logoutAPI();
      } catch (logoutErr) {
        console.error('Logout during 403 handling failed', logoutErr);
      } finally {
        navigate('/login', { replace: true });
      }
      throw error;
    }

    throw error;
  };

  return { handleAuthError };
}
