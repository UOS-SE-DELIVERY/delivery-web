import { useState } from 'react';

import { getAuthMeAPI, patchAuthMeAPI } from '@/api/auth/me/me.api';
import type { Profile as ProfileType } from '@/types/profile';

interface PersonalInfoSectionProps {
  profile: ProfileType;
  onProfileUpdate: (p: ProfileType) => void;
}

export function PersonalInfoSection({
  profile,
  onProfileUpdate,
}: PersonalInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(!profile.profile_consent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    real_name: profile.real_name || '',
    phone: profile.phone || '',
    profile_consent: profile.profile_consent,
  });

  const handleSave = async () => {
    if (form.profile_consent) {
      if (!form.real_name.trim() || !form.phone.trim()) {
        setError('이름과 전화번호를 모두 입력해주세요.');
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const payload: {
        profile_consent: boolean;
        real_name?: string;
        phone?: string;
      } = {
        profile_consent: form.profile_consent,
      };
      if (form.profile_consent) {
        payload.real_name = form.real_name;
        payload.phone = form.phone;
      }
      await patchAuthMeAPI(payload);
      const res = await getAuthMeAPI();
      const updated = res.data as ProfileType;
      onProfileUpdate(updated);
      setForm({
        real_name: updated.real_name || '',
        phone: updated.phone || '',
        profile_consent: updated.profile_consent,
      });
      setIsEditing(!updated.profile_consent);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      setError(message || '정보 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">
        {form.profile_consent ? '개인 정보' : '개인 정보 입력'}
      </h2>
      {!form.profile_consent && (
        <p className="text-muted-foreground mb-4 text-sm">
          정보 제공에 동의하고 개인정보를 입력해주세요.
        </p>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {form.profile_consent && !isEditing ? (
        <>
          <div className="space-y-3">
            <div>
              <span className="text-muted-foreground text-sm">이름</span>
              <div className="font-medium">{profile.real_name}</div>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">전화번호</span>
              <div className="font-medium">{profile.phone}</div>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">
                정보 제공 동의
              </span>
              <div className="font-medium">
                동의함
                {profile.profile_consent_at &&
                  ` (${new Date(profile.profile_consent_at).toLocaleString('ko-KR')})`}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white"
            >
              정보 수정
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">이름</label>
              <input
                type="text"
                value={form.real_name}
                onChange={e => setForm({ ...form, real_name: e.target.value })}
                placeholder="이름을 입력하세요"
                className="w-full rounded border px-3 py-2 text-sm"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">전화번호</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="010-0000-0000"
                className="w-full rounded border px-3 py-2 text-sm"
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="profile_consent"
                checked={form.profile_consent}
                onChange={e =>
                  setForm({ ...form, profile_consent: e.target.checked })
                }
                className="h-4 w-4"
                disabled={!isEditing}
              />
              <label htmlFor="profile_consent" className="text-sm font-medium">
                개인정보 제공에 동의합니다
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.profile_consent}
              className={`rounded px-4 py-2 text-white ${
                saving || !form.profile_consent
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {saving
                ? '저장 중...'
                : form.profile_consent
                  ? '저장'
                  : '정보 수정'}
            </button>
            <button
              onClick={() => {
                setForm({
                  real_name: profile.real_name || '',
                  phone: profile.phone || '',
                  profile_consent: profile.profile_consent,
                });
                setError(null);
                setIsEditing(!profile.profile_consent);
              }}
              disabled={saving}
              className="rounded border px-4 py-2 hover:bg-gray-50"
            >
              {form.profile_consent ? '취소' : '초기화'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
