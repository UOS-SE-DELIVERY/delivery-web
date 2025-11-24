import axios, { AxiosRequestConfig } from 'axios';

// 중복 리다이렉트를 방지하기 위한 가드 플래그
let isAuthRedirecting = false;

const createClient = (config?: AxiosRequestConfig) => {
  const instance = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 1000 * 10,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    ...config,
  });

  instance.interceptors.response.use(
    res => res,
    async err => {
      const status = err?.response?.status;
      let url: string = err?.config?.url || '';
      // 정규화: 전체 URL이면 도메인 제거, 선행 슬래시 보장, 끝 슬래시 제거
      url = url.replace(/^https?:\/\/[^/]+/, '');
      if (!url.startsWith('/')) url = '/' + url;
      url = url.replace(/\/+$/, '');
      const isAuthMe = url === '/auth/me';

      // 401: 인증 필요(비로그인) — 로그인 화면으로 이동 (/auth/me는 상위에서 상태만 처리)
      if (status === 401) {
        if (isAuthMe) return Promise.reject(err);
        if (!isAuthRedirecting) {
          isAuthRedirecting = true;
          alert('로그인 후 이용 가능합니다.');
          if (window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        }
        return Promise.reject(err);
      }

      // 403: 토큰 만료 등 권한 오류 — 서버에 로그아웃 요청을 보내고 로그인 페이지로 이동
      // 주의: 여기서 `httpClient` 또는 auth API wrapper를 호출하면 순환(interceptor 재귀) 위험이 있으므로
      // 전역 axios를 사용해 직접 로그아웃 엔드포인트를 호출합니다.
      if (status === 403) {
        if (isAuthMe) return Promise.reject(err);
        try {
          const base = instance.defaults.baseURL || '';
          await axios.post(
            `${base.replace(/\/$/, '')}/auth/logout`,
            undefined,
            {
              withCredentials: true,
            },
          );
        } catch (logoutErr) {
          console.error('Logout during 403 handling failed', logoutErr);
        } finally {
          // 토큰이 만료되었으니 로그인 화면으로 이동 (중복 방지)
          if (!isAuthRedirecting) {
            isAuthRedirecting = true;
            window.location.replace('/login');
          }
        }
        return Promise.reject(err);
      }

      return Promise.reject(err);
    },
  );

  return instance;
};

export const httpClient = createClient();
