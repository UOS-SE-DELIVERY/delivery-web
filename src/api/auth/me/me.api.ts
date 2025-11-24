import { httpClient } from '@/api/mainInstance';
import { Profile } from '@/types/profile';

export const getAuthMeAPI = async () => {
  return await httpClient.get('auth/me/');
};

export const patchAuthMeAPI = async (body: Partial<Profile>) => {
  return await httpClient.patch('auth/me/', body);
};

export const changeUsernameAPI = async (body: {
  new_username: string;
  password: string;
}) => {
  return await httpClient.post('auth/me/username/', body);
};

export const changePasswordAPI = async (body: {
  old_password: string;
  new_password: string;
}) => {
  return await httpClient.post('auth/me/password/', body);
};
