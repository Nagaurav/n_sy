export interface YogaClass {
  id: number;
  professional_id: number;
  title: string;
  description: string;
  duration: string; // "ONE_MONTH" etc.
  days: string;
  start_time: string; // ISO Date String
  end_time: string;   // ISO Date String
  group_online: boolean;
  group_offline: boolean;
  one_to_one_online: boolean;
  one_to_one_offline: boolean;
  home_visit: boolean;
  languages: string;
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
  gender_focus: string | null;
  location: string | null;
  city: string | null;
  time_slot: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  effective_price: number | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface YogaClassesFilters {
  page?: number;
  limit?: number;
  city?: string;
  disease?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: 'effective_price' | 'created_at' | 'title' | 'near_to_far';
  latitude?: number;
  longitude?: number;
  delivery_mode?: 'group_online' | 'group_offline' | 'one_to_one_online' | 'one_to_one_offline' | 'home_visit';
  title?: string;
}

export interface YogaClassesResponse {
  success: boolean;
  data: {
    data: YogaClass[];
    pagination: PaginationInfo;
  };
}
