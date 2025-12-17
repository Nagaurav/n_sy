// Yoga Plan Types based on API response structure

import { parseDays, parseLanguages, formatTimeFromISO, getAvailableSessionModes } from '../utils/yogaUtils';

export enum YogaPlanDuration {
  ONE_MONTH = 'ONE_MONTH',
  THREE_MONTHS = 'THREE_MONTHS',
  SIX_MONTHS = 'SIX_MONTHS',
  ONE_YEAR = 'ONE_YEAR',
}

export enum GenderFocus {
  ALL = 'all',
  MALE = 'male',
  FEMALE = 'female',
}

export interface YogaPlan {
  id: number;
  professional_id: number;
  title: string;
  description: string;
  duration: YogaPlanDuration | string;
  days: string; // Comma-separated days: "Monday,Wednesday,Friday"
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  group_online: boolean;
  group_offline: boolean;
  one_to_one_online: boolean;
  one_to_one_offline: boolean;
  home_visit: boolean;
  languages: string; // Comma-separated: "English,Hindi"
  is_disease_specific: boolean;
  disease: string | null;
  price_home_visit: number | null;
  price_one_to_one_online: number | null;
  price_one_to_one_offline: number | null;
  price_group_online: number | null;
  price_group_offline: number | null;
  max_participants_online: number | null;
  max_participants_offline: number | null;
  allow_mid_month_entry: boolean;
  gender_focus: GenderFocus | string;
  location: string | null;
  city: string | null;
  time_slot: string | null;
  latitude: string | null;
  longitude: string | null;
  created_at: string;
  updated_at: string;
}

export interface YogaPlanResponse {
  msg: string;
  data: YogaPlan;
}

// Helper type for session mode selection
export interface SessionMode {
  type: 'group_online' | 'group_offline' | 'one_to_one_online' | 'one_to_one_offline' | 'home_visit';
  label: string;
  price: number | null;
  available: boolean;
  maxParticipants?: number | null;
}

// Re-export utility functions for backward compatibility
export { parseDays, parseLanguages, formatTimeFromISO, getAvailableSessionModes } from '../utils/yogaUtils';
