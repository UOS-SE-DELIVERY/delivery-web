import axios from 'axios';
import { useNavigate } from 'react-router';

import { staffLogoutAPI } from '@/api/staff/auth.api';

/**
 * Staff 인증 에러를 처리하는 훅
 * 401: 로그인 필요 -> /staff/login으로 리다이렉트
 * 403: 권한 없음/토큰 만료 -> 로그아웃 후 /staff/login으로 리다이렉트
 */
export function useStaffAuthErrorHandler() {
  const navigate = useNavigate();

  const handleAuthError = async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const status = error.response?.status;

    // 401: 인증 필요
    if (status === 401) {
      if (window.location.pathname !== '/staff/login') {
        navigate('/staff/login', { replace: true });
      }
      throw error;
    }

    // 403: 권한 없음/토큰 만료
    if (status === 403) {
      try {
        await staffLogoutAPI();
      } catch (logoutErr) {
        console.error('Staff logout during 403 handling failed', logoutErr);
      } finally {
        if (window.location.pathname !== '/staff/login') {
          navigate('/staff/login', { replace: true });
        }
      }
      throw error;
    }

    throw error;
  };

  return { handleAuthError };
}
