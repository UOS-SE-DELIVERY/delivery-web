import { useQuery } from '@tanstack/react-query';

import { getAuthMeAPI } from '@/api/auth/me/me.api';
import { getOrdersAPI } from '@/api/order/order.api';
import { useAuthStore } from '@/store/authStore';
import type { OrderResponse } from '@/types/order';
import type { Profile } from '@/types/profile';

interface UseOrdersResult {
  orders: OrderResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 로그인한 사용자의 주문 목록을 조회하는 커스텀 훅
 * @returns orders 배열, loading 상태, error 메시지, refetch 함수
 */
export function useOrders(): UseOrdersResult {
  const isLogin = useAuthStore(s => s.isLogin);

  const {
    data: orders = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery<OrderResponse[], Error>({
    queryKey: ['orders', isLogin],
    queryFn: async () => {
      if (!isLogin) {
        return [];
      }

      // 1) 내 프로필에서 customer_id 가져오기
      const meRes = await getAuthMeAPI();
      const me = meRes.data as Profile;
      // 2) 내 주문 목록 조회
      const ordersRes = await getOrdersAPI(me.customer_id);
      return ordersRes.data as OrderResponse[];
    },
    enabled: isLogin,
    gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
  });

  const errorMessage = error
    ? error.message?.includes('401')
      ? '로그인 후 주문 내역을 확인할 수 있습니다.'
      : '주문 목록을 불러오는 중 오류가 발생했습니다.'
    : null;

  return {
    orders,
    loading,
    error: errorMessage,
    refetch,
  };
}
