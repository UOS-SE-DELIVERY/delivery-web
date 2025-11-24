import { httpClient } from '@/api/mainInstance';
import { ProfileAddress } from '@/types/profile';

export const getAddressesAPI = async () => {
  return await httpClient.get('auth/me/addresses/');
};

export const postAddressAPI = async (body: ProfileAddress) => {
  return await httpClient.post('auth/me/addresses/', body);
};

export const patchAddressAPI = async (
  idx: number, // 수정할 주소 인덱스(0-base)
  body: Partial<ProfileAddress>,
) => {
  return await httpClient.patch(`auth/me/addresses/${idx}/`, body);
};

export const deleteAddressAPI = async (
  idx: number, // 삭제할 주소 인덱스(0-base)
) => {
  return await httpClient.delete(`auth/me/addresses/${idx}/`);
};

export const patchDefaultAddressAPI = async (
  idx: number, // 기본 배송지로 설정할 주소 인덱스(0-base)
) => {
  return await httpClient.patch(`auth/me/addresses/${idx}/default/`);
};
