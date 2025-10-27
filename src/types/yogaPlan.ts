// Yoga Plan Types based on API response structure

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

// Helper function to parse days
export function parseDays(daysString: string): string[] {
  return daysString.split(',').map(day => day.trim());
}

// Helper function to parse languages
export function parseLanguages(languagesString: string): string[] {
  return languagesString.split(',').map(lang => lang.trim());
}

// Helper function to format time from ISO string
export function formatTimeFromISO(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

// Helper function to get available session modes
export function getAvailableSessionModes(plan: YogaPlan): SessionMode[] {
  const modes: SessionMode[] = [];

  if (plan.group_online) {
    modes.push({
      type: 'group_online',
      label: 'Group Online',
      price: plan.price_group_online,
      available: true,
      maxParticipants: plan.max_participants_online,
    });
  }

  if (plan.group_offline) {
    modes.push({
      type: 'group_offline',
      label: 'Group Offline',
      price: plan.price_group_offline,
      available: true,
      maxParticipants: plan.max_participants_offline,
    });
  }

  if (plan.one_to_one_online) {
    modes.push({
      type: 'one_to_one_online',
      label: 'One-to-One Online',
      price: plan.price_one_to_one_online,
      available: true,
    });
  }

  if (plan.one_to_one_offline) {
    modes.push({
      type: 'one_to_one_offline',
      label: 'One-to-One Offline',
      price: plan.price_one_to_one_offline,
      available: true,
    });
  }

  if (plan.home_visit) {
    modes.push({
      type: 'home_visit',
      label: 'Home Visit',
      price: plan.price_home_visit,
      available: true,
    });
  }

  return modes;
}
