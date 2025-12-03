import { OrderResponse } from '@/types/order';

/**
 * SSE 주문 스트림 연결
 * @param params 쿼리 파라미터
 * @param onMessage 메시지 수신 콜백
 * @param onError 에러 콜백
 * @returns EventSource 인스턴스 (연결 종료 시 close() 호출)
 */
export function subscribeOrdersSSE(
  params: SSEOrdersParams,
  onMessage: (event: SSEEvent) => void,
  onError?: (error: Event) => void,
): EventSource {
  const queryParams = new URLSearchParams();
  queryParams.append('format', 'event-stream');

  if (params.status) queryParams.append('status', params.status);
  if (params.since) queryParams.append('since', params.since);
  if (params.limit !== undefined)
    queryParams.append('limit', params.limit.toString());

  const url = `http://localhost:8000/api/staff/sse/orders?${queryParams.toString()}`;
  const eventSource = new EventSource(url, { withCredentials: true });

  // Bootstrap 이벤트 처리
  eventSource.addEventListener('bootstrap', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as OrderResponse[];
      onMessage({ event: 'bootstrap', data });
    } catch (error) {
      console.error('Failed to parse bootstrap event:', error);
    }
  });

  // order_created 이벤트 처리
  eventSource.addEventListener('order_created', (e: MessageEvent) => {
    try {
      const parsed = JSON.parse(e.data);
      // order_created 페이로드에서 전체 주문 데이터 추출
      const orderData: OrderResponse = {
        id: parsed.id,
        status: parsed.status,
        ordered_at: parsed.ordered_at,
        customer_id: parsed.customer_id || 0,
        order_source: parsed.order_source || 'GUI',
        subtotal_cents: parsed.subtotal_cents || 0,
        discount_cents: parsed.discount_cents || 0,
        total_cents: parsed.total_cents || 0,
        receiver_name: parsed.receiver_name || null,
        receiver_phone: parsed.receiver_phone || null,
        delivery_address: parsed.delivery_address || null,
        geo_lat: parsed.geo_lat || null,
        geo_lng: parsed.geo_lng || null,
        place_label: parsed.place_label || null,
        address_meta: parsed.address_meta || null,
        payment_token: parsed.payment_token || null,
        card_last4: parsed.card_last4 || null,
        meta: parsed.meta || null,
        dinners: parsed.dinners || [],
      };
      onMessage({ event: 'order_created', data: orderData });
    } catch (error) {
      console.error('Failed to parse order_created event:', error);
    }
  });

  // order_updated 이벤트 처리
  eventSource.addEventListener('order_updated', (e: MessageEvent) => {
    try {
      const parsed = JSON.parse(e.data);
      // order_updated 페이로드에서 전체 주문 데이터 추출
      const orderData: OrderResponse = {
        id: parsed.id,
        status: parsed.status,
        ordered_at: parsed.ordered_at,
        customer_id: parsed.customer_id || 0,
        order_source: parsed.order_source || 'GUI',
        subtotal_cents: parsed.subtotal_cents || 0,
        discount_cents: parsed.discount_cents || 0,
        total_cents: parsed.total_cents || 0,
        receiver_name: parsed.receiver_name || null,
        receiver_phone: parsed.receiver_phone || null,
        delivery_address: parsed.delivery_address || null,
        geo_lat: parsed.geo_lat || null,
        geo_lng: parsed.geo_lng || null,
        place_label: parsed.place_label || null,
        address_meta: parsed.address_meta || null,
        payment_token: parsed.payment_token || null,
        card_last4: parsed.card_last4 || null,
        meta: parsed.meta || null,
        dinners: parsed.dinners || [],
      };
      onMessage({ event: 'order_updated', data: orderData });
    } catch (error) {
      console.error('Failed to parse order_updated event:', error);
    }
  });

  // diagnostic 이벤트는 무시
  eventSource.addEventListener('diagnostic', () => {
    // 진단 이벤트는 로깅만 하고 무시
  });

  eventSource.onerror = error => {
    console.error('SSE connection error:', error);
    if (onError) onError(error);
  };

  return eventSource;
}

export interface SSEOrdersParams {
  status?: string; // comma-separated statuses (e.g., "pending,preparing")
  since?: string; // ISO8601 datetime (e.g., "2025-10-28T00:00:00+09:00")
  limit?: number; // bootstrap limit (1-100, default 20)
}

export interface SSEBootstrapEvent {
  event: 'bootstrap';
  data: OrderResponse[];
}

export interface SSEOrderCreatedEvent {
  event: 'order_created';
  data: OrderResponse;
}

export interface SSEOrderUpdatedEvent {
  event: 'order_updated';
  data: OrderResponse;
}

export interface SSEOrderEvent {
  event: string; // other domain event names
  data: OrderResponse;
}

export type SSEEvent =
  | SSEBootstrapEvent
  | SSEOrderCreatedEvent
  | SSEOrderUpdatedEvent
  | SSEOrderEvent;
