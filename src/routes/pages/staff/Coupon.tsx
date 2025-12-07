import {
  AlertCircle,
  Edit2,
  Plus,
  RefreshCw,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  deleteStaffCouponAPI,
  getStaffCouponsAPI,
  postStaffCouponAPI,
} from '@/api/staff/coupon.api';
import type { CreateStaffCouponRequest, StaffCoupon } from '@/types/coupon';

export function Coupon() {
  const [coupons, setCoupons] = useState<StaffCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateStaffCouponRequest>({
    code: '',
    name: '',
    label: '',
    active: true,
    kind: 'percent',
    value: 0,
    valid_from: null,
    valid_until: null,
    min_subtotal_cents: null,
    max_discount_cents: null,
    stackable_with_membership: true,
    stackable_with_coupons: true,
    channel: 'ANY',
    max_redemptions_global: null,
    max_redemptions_per_user: null,
    notes: '',
  });

  const fetchCoupons = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await getStaffCouponsAPI();
      setCoupons(response.data);
    } catch (err) {
      setError('쿠폰 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateClick = () => {
    setFormData({
      code: '',
      name: '',
      label: '',
      active: true,
      kind: 'percent',
      value: 0,
      valid_from: null,
      valid_until: null,
      min_subtotal_cents: null,
      max_discount_cents: null,
      stackable_with_membership: true,
      stackable_with_coupons: true,
      channel: 'ANY',
      max_redemptions_global: null,
      max_redemptions_per_user: null,
      notes: '',
    });
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setIsSaving(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await postStaffCouponAPI(formData);
      await fetchCoupons(true);
      handleCloseModal();
      alert('쿠폰이 생성되었습니다.');
    } catch (err) {
      alert('쿠폰 생성에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`쿠폰 "${code}"를 삭제하시겠습니까?`)) return;

    try {
      await deleteStaffCouponAPI(code);
      await fetchCoupons(true);
      alert('쿠폰이 삭제되었습니다.');
    } catch (err) {
      alert('쿠폰 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  if (loading && !isRefreshing && coupons.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground">쿠폰 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && coupons.length === 0) {
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
            <Ticket className="text-primary h-8 w-8" />
            쿠폰 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            쿠폰을 생성하고 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCoupons(true)}
            disabled={isRefreshing}
            className="border-border hover:bg-muted flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            새로고침
          </button>
          <button
            onClick={handleCreateClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            쿠폰 생성
          </button>
        </div>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="text-muted-foreground w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">
                  코드
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  이름
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  종류
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  할인
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  유효기간
                </th>
                <th scope="col" className="px-6 py-4 text-center font-semibold">
                  상태
                </th>
                <th scope="col" className="px-6 py-4 text-center font-semibold">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {coupons.map(coupon => (
                <tr
                  key={coupon.code}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="text-foreground px-6 py-4 font-mono text-xs font-medium">
                    {coupon.code}
                  </td>
                  <td className="text-foreground px-6 py-4 font-medium">
                    {coupon.name}
                  </td>
                  <td className="text-muted-foreground px-6 py-4">
                    {coupon.kind === 'percent' ? '비율' : '고정'}
                  </td>
                  <td className="text-foreground px-6 py-4">
                    {coupon.kind === 'percent'
                      ? `${coupon.value}%`
                      : `${(coupon.value / 100).toLocaleString()}원`}
                  </td>
                  <td className="text-muted-foreground px-6 py-4">
                    <div className="text-xs">
                      <div>{formatDate(coupon.valid_from)}</div>
                      <div>~ {formatDate(coupon.valid_until)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        coupon.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {coupon.active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(coupon.code)}
                      className="text-destructive hover:text-destructive/80 inline-flex items-center gap-1 text-xs font-medium transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-muted-foreground px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Ticket className="text-muted-foreground/50 h-8 w-8" />
                      <p>쿠폰이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 쿠폰 생성 모달 */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-card border-border max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-border sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <h3 className="text-foreground text-lg font-semibold">
                쿠폰 생성
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      쿠폰 코드 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={e =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      placeholder="WELCOME10"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      쿠폰 이름 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      placeholder="신규 10%"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    라벨 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={e =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      할인 종류 *
                    </label>
                    <select
                      value={formData.kind}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          kind: e.target.value as 'percent' | 'fixed',
                        })
                      }
                      className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    >
                      <option value="percent">비율 (%)</option>
                      <option value="fixed">고정 (원)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      할인 값 *
                    </label>
                    <input
                      type="number"
                      required
                      value={
                        formData.kind === 'fixed' && formData.value
                          ? formData.value / 100
                          : formData.value
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          value:
                            formData.kind === 'fixed'
                              ? Number(e.target.value) * 100
                              : Number(e.target.value),
                        })
                      }
                      className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      placeholder={formData.kind === 'percent' ? '10' : '1000'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      유효 시작일
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.valid_from || ''}
                      onChange={e =>
                        setFormData({ ...formData, valid_from: e.target.value })
                      }
                      className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      유효 종료일
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.valid_until || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          valid_until: e.target.value,
                        })
                      }
                      className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      최소 주문 금액 (원)
                    </label>
                    <input
                      type="number"
                      value={
                        formData.min_subtotal_cents
                          ? formData.min_subtotal_cents
                          : ''
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          min_subtotal_cents: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      최대 할인 금액 (원)
                    </label>
                    <input
                      type="number"
                      value={
                        formData.max_discount_cents
                          ? formData.max_discount_cents
                          : ''
                      }
                      onChange={e =>
                        setFormData({
                          ...formData,
                          max_discount_cents: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={e =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-foreground text-sm">활성</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.stackable_with_membership}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          stackable_with_membership: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-foreground text-sm">
                      멤버십과 중복 가능
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.stackable_with_coupons}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          stackable_with_coupons: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-foreground text-sm">
                      다른 쿠폰과 중복 가능
                    </span>
                  </label>
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    메모
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={e =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-muted text-muted-foreground hover:bg-muted/80 flex-1 rounded-lg px-4 py-3 font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-lg px-4 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? '생성 중...' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
