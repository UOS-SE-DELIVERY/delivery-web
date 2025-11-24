import { useState } from 'react';

import { changePasswordAPI } from '@/api/auth/me/me.api';

interface PasswordSectionProps {
  onChanged?: () => void;
}

export function PasswordSection({ onChanged }: PasswordSectionProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.old_password || !form.new_password || !form.confirm_password) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await changePasswordAPI({
        old_password: form.old_password,
        new_password: form.new_password,
      });
      setOpen(false);
      setForm({ old_password: '', new_password: '', confirm_password: '' });
      onChanged?.();
      alert('비밀번호가 변경되었습니다.');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
      setError(message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">보안</h2>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="bg-primary hover:bg-primary/90 rounded px-3 py-1.5 text-sm text-white"
          >
            비밀번호 변경
          </button>
        )}
      </div>
      {open && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-3 font-medium">비밀번호 변경</h3>
          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                현재 비밀번호
              </label>
              <input
                type="password"
                value={form.old_password}
                onChange={e =>
                  setForm({ ...form, old_password: e.target.value })
                }
                placeholder="현재 비밀번호"
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                새 비밀번호
              </label>
              <input
                type="password"
                value={form.new_password}
                onChange={e =>
                  setForm({ ...form, new_password: e.target.value })
                }
                placeholder="새 비밀번호"
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={e =>
                  setForm({ ...form, confirm_password: e.target.value })
                }
                placeholder="새 비밀번호 확인"
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {loading ? '변경 중...' : '변경'}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setForm({
                  old_password: '',
                  new_password: '',
                  confirm_password: '',
                });
                setError(null);
              }}
              className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
