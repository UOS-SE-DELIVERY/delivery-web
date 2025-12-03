import { ReactNode, useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';

import { getAuthMeAPI } from '@/api/auth/me/me.api';
import { useAuthStore } from '@/store/authStore';

export function AuthInitializer() {
  const storeLogin = useAuthStore(state => state.storeLogin);
  const storeLogout = useAuthStore(state => state.storeLogout);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const res = await getAuthMeAPI();
        if (!mounted) return;
        // 로그인 정보가 있으면 클라이언트 상태를 로그인으로 설정
        if (res?.data && Object.keys(res.data).length > 0) {
          storeLogin();
        } else {
          storeLogout();
        }
      } catch {
        // 실패하면 로그아웃 상태로 초기화
        storeLogout();
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, [storeLogin, storeLogout]);

  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
