export interface ProfileAddress {
  label: string;
  line: string;
  lat: number;
  lng: number;
  is_default: boolean;
}

export interface Profile {
  customer_id: number;
  username: string;
  real_name?: string;
  phone?: string;
  addresses?: ProfileAddress[];
  loyalty_tier: string;
  profile_consent: boolean;
  profile_consent_at?: string;
}
