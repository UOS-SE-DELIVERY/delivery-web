import { AlertCircle, Package, Pencil } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  executeOrderActionAPI,
  getStaffOrderAPI,
  OrderAction,
  StaffOrderDetailResponse,
} from '@/api/staff/order/order.api';
import { subscribeOrdersSSE } from '@/api/staff/order/sse.api';
import { OrderModal } from '@/components/staff/OrderModal';
import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  ORDER_STATUS_LABELS,
  OrderResponse,
  OrderStatus,
} from '@/types/order';

// 상태 키 메모이즈

export function Home() {
  const STATUS_KEYS = useMemo(
    () => Object.keys(ORDER_STATUS_LABELS) as OrderStatus[],
    [],
  );
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'error'
  >('connecting');
  const [selectedOrder, setSelectedOrder] =
    useState<StaffOrderDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusButtons, setShowStatusButtons] = useState(false);

  useEffect(() => {
    setConnectionStatus('connecting');
    setLoading(true);
    setError(null);

    const eventSource = subscribeOrdersSSE(
      { limit: 20 },
      event => {
        if (event.event === 'bootstrap') {
          // 초기 주문 목록 설정 (배열)
          const initial = event.data as OrderResponse[];
          setOrders(initial);
          setLoading(false);
          setConnectionStatus('connected');
        } else if (event.event === 'order_created') {
          // 새 주문 추가 (최신 순)
          const order = event.data as OrderResponse;
          setOrders(prev => [order, ...prev]);
          setConnectionStatus('connected');
        }
      },
      () => {
        setError('주문 스트림 연결에 실패했습니다.');
        setConnectionStatus('error');
        setLoading(false);
      },
    );

    // Cleanup: 컴포넌트 언마운트 시 연결 종료
    return () => {
      eventSource.close();
    };
  }, []);

  const getStatusBadge = (status: OrderStatus) => {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getOrderStatusBadgeClass(status)}`}
      >
        {getOrderStatusLabel(status)}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOrderClick = useCallback(async (orderId: number) => {
    setShowStatusButtons(false);
    setDetailLoading(true);
    setSelectedOrder({} as StaffOrderDetailResponse); // 모달 즉시 표시
    try {
      const response = await getStaffOrderAPI(orderId);
      setSelectedOrder(response.data);
    } catch (err) {
      console.error('주문 상세 조회 실패:', err);
      alert('주문 상세 정보를 불러오지 못했습니다.');
      setSelectedOrder(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleStatusClick = useCallback(
    (e: React.MouseEvent, orderId: number) => {
      e.stopPropagation(); // 행 클릭 이벤트 방지
      setShowStatusButtons(true);
      const base = orders.find(o => o.id === orderId);
      if (base) {
        // 패널은 현재 상태만 필요하므로 목록 데이터로 즉시 표시
        setSelectedOrder({
          id: base.id,
          status: base.status,
        } as StaffOrderDetailResponse);
      } else {
        setShowStatusButtons(false);
      }
    },
    [orders],
  );

  const handleStatusChange = useCallback(
    async (status: OrderStatus) => {
      if (!selectedOrder || status === 'pending') return;

      if (
        !confirm(
          `주문 상태를 "${getOrderStatusLabel(status)}"(으)로 변경하시겠습니까?`,
        )
      ) {
        return;
      }

      setActionLoading(true);
      try {
        await executeOrderActionAPI(selectedOrder.id, {
          action: status as OrderAction,
        });
        // 프론트에서 사용한 status 값으로 직접 갱신
        setSelectedOrder(prev => (prev ? { ...prev, status } : prev));
        setOrders(prev => {
          const updated = prev.map(o =>
            o.id === selectedOrder.id ? { ...o, status } : o,
          );
          console.log('[orders state updated]', updated);
          return updated;
        });
        alert('주문 상태가 변경되었습니다.');
      } catch (err) {
        console.error('주문 상태 변경 실패:', err);
        alert('주문 상태 변경에 실패했습니다.');
      } finally {
        setActionLoading(false);
      }
    },
    [selectedOrder],
  );

  const closeModal = useCallback(() => {
    setSelectedOrder(null);
    setShowStatusButtons(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="bg-destructive/10 flex max-w-md flex-col items-center gap-4 rounded-lg p-8 text-center">
          <AlertCircle className="text-destructive h-12 w-12" />
          <h3 className="text-destructive text-lg font-semibold">오류 발생</h3>
          <p className="text-destructive/80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <Package className="text-primary h-8 w-8" />
            실시간 주문 현황
          </h1>
          <p className="text-muted-foreground mt-1">
            서버에서 실시간으로 주문 변경사항을 수신합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-2 text-sm ${
              connectionStatus === 'connected'
                ? 'text-green-600'
                : connectionStatus === 'error'
                  ? 'text-red-600'
                  : 'text-yellow-600'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-600'
                  : connectionStatus === 'error'
                    ? 'bg-red-600'
                    : 'animate-pulse bg-yellow-600'
              }`}
            ></span>
            {connectionStatus === 'connected'
              ? '연결됨'
              : connectionStatus === 'error'
                ? '연결 끊김'
                : '연결 중...'}
          </span>
        </div>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="text-muted-foreground w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">
                  주문 ID
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  주문 시간
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  수령인
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  배달 주소
                </th>
                <th scope="col" className="px-6 py-4 text-center font-semibold">
                  상태
                </th>
                <th scope="col" className="px-6 py-4 text-right font-semibold">
                  금액
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {orders.map(order => (
                <tr
                  key={order.id}
                  className="hover:bg-primary/5 hover:border-l-primary cursor-pointer transition-all hover:border-l-4"
                  onClick={() => handleOrderClick(order.id)}
                >
                  <td className="text-foreground px-6 py-4 font-mono text-xs font-medium">
                    #{order.id}
                  </td>
                  <td className="text-muted-foreground px-6 py-4">
                    {formatDate(order.ordered_at)}
                  </td>
                  <td className="text-foreground px-6 py-4">
                    <div>{order.receiver_name || '-'}</div>
                    <div className="text-muted-foreground text-xs">
                      {order.receiver_phone || ''}
                    </div>
                  </td>
                  <td className="text-muted-foreground px-6 py-4">
                    <div className="max-w-xs truncate">
                      {order.delivery_address || ''}
                    </div>
                    {order.place_label && (
                      <div className="text-muted-foreground text-xs">
                        {order.place_label}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      {getStatusBadge(order.status)}
                      <span
                        aria-hidden
                        className="border-border mx-2 h-4 border-l"
                      />
                      <button
                        type="button"
                        onClick={e => handleStatusClick(e, order.id)}
                        className="border-primary/50 text-primary hover:bg-primary/10 focus:ring-primary/50 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:outline-none"
                        title="상태 변경"
                        aria-label={`주문 #${order.id} 상태 변경`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>상태 변경</span>
                      </button>
                    </div>
                  </td>
                  <td className="text-foreground px-6 py-4 text-right font-medium">
                    {order.total_cents.toLocaleString()}원
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="text-muted-foreground/50 h-8 w-8" />
                      <p>주문이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!showStatusButtons && (
        <OrderModal
          order={selectedOrder}
          isLoading={detailLoading}
          onClose={closeModal}
        />
      )}

      {/* 주문 상태 변경 버튼 */}
      {selectedOrder && showStatusButtons && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="bg-card border-border rounded-xl border p-6 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-foreground text-lg font-semibold">
                주문 상태 변경 (#{selectedOrder.id})
              </h3>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_KEYS.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={
                    actionLoading ||
                    selectedOrder.status === status ||
                    status === 'pending'
                  }
                  title={
                    status === 'pending'
                      ? '초기 상태는 선택할 수 없습니다'
                      : undefined
                  }
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedOrder.status === status
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {getOrderStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
