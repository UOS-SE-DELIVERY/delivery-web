import { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';

import { staffMeAPI } from '@/api/staff/auth.api';
import { StaffHeader } from '@/components/staff/StaffHeader';
import { useStaffAuthErrorHandler } from '@/hooks/useStaffAuthErrorHandler';
import { useStaffAuthStore } from '@/store/staffAuthStore';

export function AuthInitializer() {
  const storeLogin = useStaffAuthStore(state => state.storeLogin);
  const storeLogout = useStaffAuthStore(state => state.storeLogout);
  const { handleAuthError } = useStaffAuthErrorHandler();

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const res = await staffMeAPI();
        if (!mounted) return;
        // 로그인 정보가 있으면 클라이언트 상태를 로그인으로 설정
        if (res?.data && Object.keys(res.data).length > 0) {
          storeLogin();
        } else {
          storeLogout();
        }
      } catch (error) {
        // 실패하면 로그아웃 상태로 초기화
        storeLogout();
        await handleAuthError(error).catch(() => {
          // 에러는 무시 (이미 리다이렉트됨)
        });
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, [storeLogin, storeLogout, handleAuthError]);

  return (
    <>
      <StaffHeader />
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
