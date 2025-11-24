import { useState } from 'react';

import type { Profile as ProfileType } from '@/types/profile';

interface UsernameSectionProps {
  profile: ProfileType;
  onChangeUsername: (new_username: string, password: string) => Promise<void>;
}

export function UsernameSection({
  profile,
  onChangeUsername,
}: UsernameSectionProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ new_username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.new_username.trim() || !form.password.trim()) {
      setError('새 사용자명과 현재 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onChangeUsername(form.new_username, form.password);
      setOpen(false);
      setForm({ new_username: '', password: '' });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      setError(message || '사용자명 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">사용자명</span>
          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="text-primary hover:text-primary/80 text-xs"
            >
              변경
            </button>
          )}
        </div>
        {!open ? (
          <div className="font-medium">{profile.username}</div>
        ) : (
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium">
                새 사용자명
              </label>
              <input
                type="text"
                value={form.new_username}
                onChange={e =>
                  setForm({ ...form, new_username: e.target.value })
                }
                placeholder="새 사용자명 입력"
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                현재 비밀번호 확인
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="현재 비밀번호"
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 rounded px-3 py-1.5 text-xs text-white disabled:opacity-60"
              >
                {loading ? '변경 중...' : '변경'}
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setForm({ new_username: '', password: '' });
                  setError(null);
                }}
                className="rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
      <div>
        <span className="text-muted-foreground text-sm">고객 ID</span>
        <div className="font-medium">{profile.customer_id}</div>
      </div>
      <div>
        <span className="text-muted-foreground text-sm">등급</span>
        <div className="font-medium">{profile.loyalty_tier}</div>
      </div>
    </div>
  );
}
