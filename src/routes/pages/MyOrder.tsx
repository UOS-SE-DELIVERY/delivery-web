/* eslint-disable simple-import-sort/imports */
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router';

import { getAuthMeAPI } from '@/api/auth/me/me.api';
import { getOrdersAPI } from '@/api/order/order.api';
import { useAuthStore } from '@/store/authStore';
import type {
  OrderDinnerOption,
  OrderItemOption,
  OrderResponse,
} from '@/types/order';
import type { Profile } from '@/types/profile';

export function MyOrder() {
  const navigate = useNavigate();
  const isLogin = useAuthStore(s => s.isLogin);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!isLogin) {
      // 로그인 상태가 아니면 API 호출을 건너뜀
      setOrders([]);
      setLoading(false);
      setError(null);
      return;
    }
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) 내 프로필에서 customer_id 가져오기
        const meRes = await getAuthMeAPI();
        const me = meRes.data as Profile;
        // 2) 내 주문 목록 조회 (최신순은 서버 정렬 가정)
        const ordersRes = await getOrdersAPI(me.customer_id);
        const data = ordersRes.data as OrderResponse[];
        if (!isMounted) return;
        setOrders(data);
      } catch (e: unknown) {
        if (!isMounted) return;
        type HttpErrorLike = { response?: { status?: number } };
        const status = (e as HttpErrorLike)?.response?.status;
        if (status === 401) {
          setError('로그인 후 주문 내역을 확인할 수 있습니다.');
        } else {
          setError('주문 목록을 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [isLogin]);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString('ko-KR') + '원';

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ko-KR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  // 수량 문자열이 '1.00' 같은 형태로 올 때 정수로 깔끔하게 표시
  const asInt = (val: string | number) => {
    const str = String(val);
    // 정수 또는 .0, .00 으로만 끝나는 경우 소수부 제거
    if (/^-?\d+(?:\.0+)?$/.test(str)) return str.replace(/\.0+$/, '');
    const num = Number(val);
    return Number.isFinite(num) ? Math.round(num).toString() : str;
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '대기',
      confirmed: '확정',
      preparing: '준비중',
      delivering: '배달중',
      delivered: '완료',
      cancelled: '취소',
    };
    return map[status] ?? status;
  };

  const statusBadgeClass = (status: string) => {
    const base =
      'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium';
    switch (status) {
      case 'pending':
        return `${base} bg-gray-100 text-gray-700`;
      case 'confirmed':
      case 'preparing':
        return `${base} bg-amber-100 text-amber-800`;
      case 'delivering':
        return `${base} bg-blue-100 text-blue-700`;
      case 'delivered':
        return `${base} bg-green-100 text-green-700`;
      case 'cancelled':
        return `${base} bg-red-100 text-red-700`;
      default:
        return `${base} bg-gray-100 text-gray-700`;
    }
  };

  const toggleExpand = (orderId: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders) set.add(o.status);
    return Array.from(set);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  const SkeletonCard = () => (
    <li className="animate-pulse rounded border p-4">
      <div className="mb-3 h-4 w-40 rounded bg-gray-200" />
      <div className="mb-2 h-3 w-24 rounded bg-gray-200" />
      <div className="h-3 w-64 rounded bg-gray-200" />
    </li>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* 헤더 & 필터 */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">주문 목록</h1>
          {isLogin && (
            <p className="mt-1 text-sm text-gray-500">
              총 {orders.length.toLocaleString('ko-KR')}건의 주문
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLogin && (
            <>
              <label htmlFor="statusFilter" className="text-sm text-gray-600">
                상태 필터
              </label>
              <select
                id="statusFilter"
                className="rounded border px-2 py-1 text-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">전체</option>
                {uniqueStatuses.map(s => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </>
          )}
          {/* 상단 오른쪽 뒤로가기 버튼 (Profile과 통일) */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            이전 페이지로
          </button>
        </div>
      </div>

      {/* 미로그인 시 본문 영역에 로그인 유도 표시 */}
      {!isLogin ? (
        <div className="rounded border bg-white p-8 text-center">
          <div className="mb-2 text-sm text-gray-600">
            주문 내역을 보려면 로그인이 필요합니다.
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white"
          >
            로그인하러 가기
          </button>
        </div>
      ) : (
        <>
          {loading && (
            <ul className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </ul>
          )}

          {error && !loading && (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && filteredOrders.length === 0 && (
            <div className="rounded border bg-white p-8 text-center">
              <div className="mb-2 text-sm text-gray-600">
                해당 조건의 주문 내역이 없습니다.
              </div>
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white"
              >
                주문하러 가기
              </button>
            </div>
          )}

          {!loading && !error && filteredOrders.length > 0 && (
            <ul className="space-y-3">
              {filteredOrders.map(order => {
                const dinnerSummary = order.dinners
                  .map(d => `${d.dinner_name} x ${asInt(d.quantity)}`)
                  .join(', ');
                const addressLine =
                  order.delivery_address || order.place_label || '-';
                const receiver = order.receiver_name || '-';
                const phone = order.receiver_phone || '-';
                const isOpen = expanded.has(order.id);

                return (
                  <li
                    key={order.id}
                    className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    {/* 카드 헤더 */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={statusBadgeClass(order.status)}>
                            {statusLabel(order.status)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(order.ordered_at)}
                          </span>
                        </div>
                        <div className="mt-2 truncate text-sm text-gray-700">
                          {dinnerSummary}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">총 결제금액</div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(order.total_cents)}
                        </div>
                        {order.discount_cents > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            할인 {formatCurrency(order.discount_cents)} 적용됨
                          </div>
                        )}
                        {order.card_last4 && (
                          <div className="mt-1 text-xs text-gray-500">
                            카드 •••• {order.card_last4}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 카드 본문 */}
                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-3">
                      <div>
                        <span className="text-gray-500">받는 분: </span>
                        <span className="font-medium">{receiver}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">연락처: </span>
                        <span className="font-medium">{phone}</span>
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-gray-500">배송지: </span>
                        <span className="font-medium">{addressLine}</span>
                      </div>
                    </div>

                    {/* 상세 토글 버튼 (아래로 이동 및 가독성 강화) */}
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => toggleExpand(order.id)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden
                        />
                        {isOpen ? '간단히 보기' : '상세 보기'}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="mt-4 border-t pt-4">
                        <h3 className="mb-2 text-sm font-semibold text-gray-700">
                          주문 상세
                        </h3>
                        <div className="space-y-3">
                          {order.dinners.map(d => (
                            <div
                              key={d.id}
                              className="rounded border bg-gray-50 p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="font-medium">
                                  {d.dinner_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  수량 {asInt(d.quantity)} · 스타일{' '}
                                  {d.style_name}
                                </div>
                              </div>

                              {/* 디너 옵션 */}
                              {d.options?.length ? (
                                <div className="mt-2 text-sm">
                                  <div className="font-medium text-gray-600">
                                    디너 옵션:
                                  </div>
                                  <ul className="mt-1 ml-4 space-y-0.5">
                                    {d.options.map((opt: OrderDinnerOption) => (
                                      <li
                                        key={opt.id}
                                        className="flex items-start justify-between gap-2 text-gray-700"
                                      >
                                        <span>
                                          • {opt.option_group_name}:{' '}
                                          {opt.option_name}
                                        </span>
                                        {opt.price_delta_cents !== 0 && (
                                          <span className="shrink-0 text-xs">
                                            {opt.price_delta_cents > 0
                                              ? '+'
                                              : ''}
                                            {formatCurrency(
                                              opt.price_delta_cents,
                                            )}
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}

                              {/* 아이템 구성 */}
                              {d.items?.length ? (
                                <div className="mt-3 text-sm">
                                  <div className="font-medium text-gray-600">
                                    구성 아이템:
                                  </div>
                                  <ul className="mt-1 space-y-2">
                                    {d.items.map(it => {
                                      const qty = Number(it.final_qty);
                                      const unitPrice =
                                        it.unit_price_cents || 0;
                                      const itemBaseTotal = qty * unitPrice;

                                      return (
                                        <li key={it.id} className="ml-4">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                              <div className="font-medium text-gray-800">
                                                • {it.item_name}
                                              </div>
                                              <div className="mt-0.5 text-xs text-gray-600">
                                                {asInt(it.final_qty)} ×{' '}
                                                {formatCurrency(unitPrice)}
                                              </div>
                                            </div>
                                            <div className="shrink-0 text-right font-medium text-gray-800">
                                              {formatCurrency(itemBaseTotal)}
                                            </div>
                                          </div>

                                          {/* 아이템 옵션 (들여쓰기) */}
                                          {it.options?.length ? (
                                            <ul className="mt-1 ml-4 space-y-0.5">
                                              {it.options.map(
                                                (o: OrderItemOption) => (
                                                  <li
                                                    key={o.id}
                                                    className="flex items-start justify-between gap-2 text-xs text-gray-600"
                                                  >
                                                    <span>
                                                      ∟ {o.option_group_name}:{' '}
                                                      {o.option_name}
                                                    </span>
                                                    {o.price_delta_cents !==
                                                      0 && (
                                                      <span className="shrink-0">
                                                        {o.price_delta_cents > 0
                                                          ? '+'
                                                          : ''}
                                                        {formatCurrency(
                                                          o.price_delta_cents,
                                                        )}
                                                      </span>
                                                    )}
                                                  </li>
                                                ),
                                              )}
                                            </ul>
                                          ) : null}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {/* 하단 왼쪽 뒤로가기 버튼 (Profile과 통일) */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded border px-4 py-2 hover:bg-gray-50"
            >
              이전 페이지로
            </button>
          </div>
        </>
      )}
    </div>
  );
}
