import { useState } from 'react';

import {
  deleteAddressAPI,
  patchAddressAPI,
  patchDefaultAddressAPI,
  postAddressAPI,
} from '@/api/auth/me/address.api';
import type { ProfileAddress } from '@/types/profile';

interface AddressSectionProps {
  addresses: ProfileAddress[] | undefined;
  onRefresh: () => Promise<void>;
}

export function AddressSection({ addresses, onRefresh }: AddressSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [form, setForm] = useState<ProfileAddress>({
    label: '',
    line: '',
    lat: 0,
    lng: 0,
    is_default: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setIsAdding(false);
    setEditingIdx(null);
    setForm({ label: '', line: '', lat: 0, lng: 0, is_default: false });
    setError(null);
  };

  const handleAdd = () => {
    reset();
    setIsAdding(true);
  };

  const handleEdit = (idx: number) => {
    if (!addresses || !addresses[idx]) return;
    setForm({ ...addresses[idx] });
    setEditingIdx(idx);
    setIsAdding(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.line.trim()) {
      setError('배송지 이름과 주소를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (editingIdx !== null) {
        await patchAddressAPI(editingIdx, form);
      } else {
        await postAddressAPI(form);
      }
      await onRefresh();
      reset();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      setError(message || '배송지 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idx: number) => {
    if (!confirm('이 배송지를 삭제하시겠습니까?')) return;
    try {
      await deleteAddressAPI(idx);
      await onRefresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      alert(message || '배송지 삭제에 실패했습니다.');
    }
  };

  const handleSetDefault = async (idx: number) => {
    try {
      await patchDefaultAddressAPI(idx);
      await onRefresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      alert(message || '기본 배송지 설정에 실패했습니다.');
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">배송지 정보</h2>
        {!isAdding && editingIdx === null && (
          <button
            onClick={handleAdd}
            className="bg-primary hover:bg-primary/90 rounded px-3 py-1.5 text-sm text-white"
          >
            + 배송지 추가
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {(isAdding || editingIdx !== null) && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-3 font-medium">
            {editingIdx !== null ? '배송지 수정' : '새 배송지 추가'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                배송지 이름
              </label>
              <input
                type="text"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder="예: 우리집, 회사"
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">주소</label>
              <input
                type="text"
                value={form.line}
                onChange={e => setForm({ ...form, line: e.target.value })}
                placeholder="서울 OO구 OO로 12"
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">위도</label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.lat}
                  onChange={e =>
                    setForm({ ...form, lat: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="37.57"
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">경도</label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.lng}
                  onChange={e =>
                    setForm({ ...form, lng: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="126.98"
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="address_is_default"
                checked={form.is_default}
                onChange={e =>
                  setForm({ ...form, is_default: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label
                htmlFor="address_is_default"
                className="text-sm font-medium"
              >
                기본 배송지로 설정
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              저장
            </button>
            <button
              onClick={reset}
              className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {addresses && addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((addr, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-4 ${
                addr.is_default
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{addr.label}</span>
                  {addr.is_default && (
                    <span className="bg-primary text-primary-foreground rounded px-2 py-0.5 text-xs">
                      기본
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(idx)}
                      className="text-primary hover:text-primary/80 text-xs"
                    >
                      기본으로 설정
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(idx)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(idx)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="text-muted-foreground text-sm">{addr.line}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                위도: {addr.lat}, 경도: {addr.lng}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isAdding &&
        editingIdx === null && (
          <div className="text-muted-foreground py-8 text-center text-sm">
            등록된 배송지가 없습니다.
          </div>
        )
      )}
    </div>
  );
}
