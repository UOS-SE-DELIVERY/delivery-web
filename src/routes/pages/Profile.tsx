import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { changeUsernameAPI, getAuthMeAPI } from '@/api/auth/me/me.api';
import { AddressSection } from '@/components/profile/AddressSection';
import { PasswordSection } from '@/components/profile/PasswordSection';
import { PersonalInfoSection } from '@/components/profile/PersonalInfoSection';
import { UsernameSection } from '@/components/profile/UsernameSection';
import { useAuthStore } from '@/store/authStore';
import type { Profile as ProfileType } from '@/types/profile';

export function Profile() {
  const navigate = useNavigate();
  const isLogin = useAuthStore(s => s.isLogin);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 로그인하지 않은 경우 API 호출 생략하고 바로 로그인 안내 표시 준비
    if (!isLogin) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAuthMeAPI();
        const data = res.data as ProfileType;
        setProfile(data);
        // Subcomponents will manage their own local edit states
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : (err as { response?: { data?: { message?: string } } })?.response
                ?.data?.message;
        setError(message || '프로필 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isLogin]);

  // Username change handler for subcomponent
  const handleUsernameChange = async (
    new_username: string,
    password: string,
  ) => {
    await changeUsernameAPI({ new_username, password });
    await refreshProfile();
    alert('사용자명이 변경되었습니다.');
  };

  const refreshProfile = async () => {
    try {
      const res = await getAuthMeAPI();
      const data = res.data as ProfileType;
      setProfile(data);
    } catch (err) {
      console.error('프로필 새로고침 실패:', err);
    }
  };

  // 단일 반환: 헤더는 항상 노출, 콘텐츠만 상태별 분기 (MyOrder 패턴)
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">나의 정보</h1>
        <button
          onClick={() => navigate(-1)}
          className="rounded border px-4 py-2 hover:bg-gray-50"
        >
          이전 페이지로
        </button>
      </div>

      {/* 상태별 컨텐츠 */}
      {!isLogin ? (
        <div className="rounded border bg-white p-8 text-center">
          <div className="mb-2 text-sm text-gray-600">
            프로필을 보려면 로그인이 필요합니다.
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white"
          >
            로그인하러 가기
          </button>
        </div>
      ) : loading ? (
        <div className="rounded border bg-white p-8 text-center text-sm text-gray-600">
          로딩 중...
        </div>
      ) : error ? (
        <div className="rounded border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : !profile ? (
        <div className="rounded border bg-white p-8 text-center text-sm text-gray-600">
          프로필 정보가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>
            <UsernameSection
              profile={profile}
              onChangeUsername={handleUsernameChange}
            />
          </div>
          <PasswordSection />
          <PersonalInfoSection
            profile={profile}
            onProfileUpdate={updated => setProfile(updated)}
          />
          <AddressSection
            addresses={profile.addresses}
            onRefresh={refreshProfile}
          />
        </div>
      )}

      {/* 하단 뒤로가기 버튼 (상단과 통일) */}
      <div className="mt-6">
        <button
          onClick={() => navigate(-1)}
          className="rounded border px-4 py-2 hover:bg-gray-50"
        >
          이전 페이지로
        </button>
      </div>
    </div>
  );
}
