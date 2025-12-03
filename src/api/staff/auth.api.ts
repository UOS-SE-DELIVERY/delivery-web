import { httpClient } from '@/api/mainInstance';

export const staffLoginAPI = async (loginPayload: StaffLoginPayload) => {
  return await httpClient.post('staff/login', loginPayload);
};

export const staffMeAPI = async () => {
  return await httpClient.get('staff/me');
};

export const staffLogoutAPI = async () => {
  return await httpClient.post('staff/logout');
};

export type StaffLoginPayload = {
  username: string;
  password: string;
};
