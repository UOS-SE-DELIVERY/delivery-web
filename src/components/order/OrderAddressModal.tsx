import { useEffect, useState } from 'react';

import {
  deleteAddressAPI,
  patchAddressAPI,
  patchDefaultAddressAPI,
  postAddressAPI,
} from '@/api/auth/me/address.api';
import { getAuthMeAPI } from '@/api/auth/me/me.api';
import type { Profile, ProfileAddress } from '@/types/profile';

interface OrderAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: ProfileAddress, idx: number) => void;
  currentSelectedIdx: number | null;
}

export function OrderAddressModal({
  isOpen,
  onClose,
  onSelectAddress,
  currentSelectedIdx,
}: OrderAddressModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(
    currentSelectedIdx,
  );

  // 배송지 추가/수정 상태
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressIdx, setEditingAddressIdx] = useState<number | null>(
    null,
  );
  const [addressForm, setAddressForm] = useState<ProfileAddress>({
    label: '',
    line: '',
    lat: 0,
    lng: 0,
    is_default: false,
  });
  const [addressError, setAddressError] = useState<string | null>(null);

  const refreshProfile = async () => {
    setLoading(true);
    try {
      const res = await getAuthMeAPI();
      const data = res.data as Profile;
      setProfile(data);
    } catch (err) {
      console.error('프로필 새로고침 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshProfile();
      setSelectedIdx(currentSelectedIdx);
    }
  }, [isOpen, currentSelectedIdx]);

  const handleAddAddress = () => {
    setAddressForm({
      label: '',
      line: '',
      lat: 0,
      lng: 0,
      is_default: false,
    });
    setIsAddingAddress(true);
    setEditingAddressIdx(null);
    setAddressError(null);
  };

  const handleEditAddress = (idx: number) => {
    if (profile?.addresses && profile.addresses[idx]) {
      setAddressForm({ ...profile.addresses[idx] });
      setEditingAddressIdx(idx);
      setIsAddingAddress(false);
      setAddressError(null);
    }
  };

  const handleSaveAddress = async () => {
    if (!addressForm.label.trim() || !addressForm.line.trim()) {
      setAddressError('배송지 이름과 주소를 입력해주세요.');
      return;
    }

    try {
      if (editingAddressIdx !== null) {
        await patchAddressAPI(editingAddressIdx, addressForm);
      } else {
        await postAddressAPI(addressForm);
      }
      await refreshProfile();
      setIsAddingAddress(false);
      setEditingAddressIdx(null);
      setAddressError(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      setAddressError(message || '배송지 저장에 실패했습니다.');
    }
  };

  const handleDeleteAddress = async (idx: number) => {
    if (!confirm('이 배송지를 삭제하시겠습니까?')) return;

    try {
      await deleteAddressAPI(idx);
      // 삭제한 배송지가 선택된 배송지였다면 선택 해제
      if (selectedIdx === idx) {
        setSelectedIdx(null);
      } else if (selectedIdx !== null && selectedIdx > idx) {
        // 앞의 배송지가 삭제되면 인덱스 조정
        setSelectedIdx(selectedIdx - 1);
      }
      await refreshProfile();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      alert(message || '배송지 삭제에 실패했습니다.');
    }
  };

  const handleSetDefaultAddress = async (idx: number) => {
    try {
      await patchDefaultAddressAPI(idx);
      await refreshProfile();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      alert(message || '기본 배송지 설정에 실패했습니다.');
    }
  };

  const handleCancelAddress = () => {
    setIsAddingAddress(false);
    setEditingAddressIdx(null);
    setAddressError(null);
  };

  const handleSelectAndClose = () => {
    if (selectedIdx !== null && profile?.addresses?.[selectedIdx]) {
      onSelectAddress(profile.addresses[selectedIdx], selectedIdx);
      onClose();
    } else {
      alert('배송지를 선택해주세요.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="mb-4 text-xl font-bold">배송지 선택</h2>

        {loading && <div className="mb-4 text-sm">로딩 중...</div>}

        {addressError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {addressError}
          </div>
        )}

        {/* 배송지 추가/수정 폼 */}
        {(isAddingAddress || editingAddressIdx !== null) && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-3 font-medium">
              {editingAddressIdx !== null ? '배송지 수정' : '배송지 추가'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  배송지 이름
                </label>
                <input
                  type="text"
                  value={addressForm.label}
                  onChange={e =>
                    setAddressForm({ ...addressForm, label: e.target.value })
                  }
                  placeholder="예: 집, 회사"
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">주소</label>
                <input
                  type="text"
                  value={addressForm.line}
                  onChange={e =>
                    setAddressForm({ ...addressForm, line: e.target.value })
                  }
                  placeholder="도로명 주소"
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">위도</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={addressForm.lat}
                    onChange={e =>
                      setAddressForm({
                        ...addressForm,
                        lat: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="37.566"
                    className="w-full rounded border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">경도</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={addressForm.lng}
                    onChange={e =>
                      setAddressForm({
                        ...addressForm,
                        lng: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="126.978"
                    className="w-full rounded border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default_modal"
                  checked={addressForm.is_default}
                  onChange={e =>
                    setAddressForm({
                      ...addressForm,
                      is_default: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="is_default_modal" className="text-sm">
                  기본 배송지로 설정
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSaveAddress}
                className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-sm text-white"
              >
                저장
              </button>
              <button
                onClick={handleCancelAddress}
                className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 배송지 추가 버튼 */}
        {!isAddingAddress && editingAddressIdx === null && (
          <div className="mb-4">
            <button
              onClick={handleAddAddress}
              className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-sm text-white"
            >
              + 새 배송지 추가
            </button>
          </div>
        )}

        {/* 배송지 목록 */}
        {profile?.addresses && profile.addresses.length > 0 ? (
          <div className="mb-4 space-y-3">
            {profile.addresses.map((addr, idx) => (
              <div
                key={idx}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  selectedIdx === idx
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedIdx(idx)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={selectedIdx === idx}
                          onChange={() => setSelectedIdx(idx)}
                          className="h-4 w-4"
                          onClick={e => e.stopPropagation()}
                        />
                        <span className="font-medium">{addr.label}</span>
                      </div>
                      {addr.is_default && (
                        <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-medium">
                          기본 배송지
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {addr.line}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      위도: {addr.lat.toFixed(6)}, 경도: {addr.lng.toFixed(6)}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col gap-1">
                    {!addr.is_default && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleSetDefaultAddress(idx);
                        }}
                        className="text-primary hover:text-primary/80 text-xs whitespace-nowrap"
                      >
                        기본 설정
                      </button>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleEditAddress(idx);
                      }}
                      className="text-primary hover:text-primary/80 text-xs whitespace-nowrap"
                    >
                      수정
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteAddress(idx);
                      }}
                      className="text-xs whitespace-nowrap text-red-600 hover:text-red-700"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isAddingAddress &&
          editingAddressIdx === null && (
            <div className="text-muted-foreground mb-4 py-8 text-center text-sm">
              등록된 배송지가 없습니다. 새 배송지를 추가해주세요.
            </div>
          )
        )}

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <button
            onClick={onClose}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSelectAndClose}
            disabled={selectedIdx === null}
            className={`rounded px-6 py-2 text-white ${
              selectedIdx === null
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            선택한 배송지로 변경
          </button>
        </div>
      </div>
    </div>
  );
}
