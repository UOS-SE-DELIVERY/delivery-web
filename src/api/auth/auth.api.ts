import { httpClient } from '@/api/mainInstance';

export const loginAPI = async (loginPayload: LoginPayload) => {
  return await httpClient.post('auth/login', loginPayload);
};

export const JoinAPI = async (joinPayload: JoinPayload) => {
  return await httpClient.post('auth/register', joinPayload);
};

export const logoutAPI = async () => {
  return await httpClient.post('auth/logout');
};

export type LoginPayload = {
  username: string;
  password: string;
};

type JoinAddress = {
  label: string;
  line: string;
  lat: number;
  lng: number;
};

type JoinPayload = {
  username: string;
  password: string;
  address?: JoinAddress;
  phone?: string;
  real_name?: string;
  profile_consent: boolean;
};
