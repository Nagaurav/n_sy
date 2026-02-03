export interface MealItem {
  id: number;
  diet_plan_id: number;
  name: string;        // e.g., "Breakfast"
  time: string;        // e.g., "08:00 AM"
  description: string; // e.g., "Oats with milk"
  calories?: number;
  created_at: string;
}

export interface DietPlan {
  id: number;
  user_id: number;
  professional_id: number;
  booking_id: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  instructions?: string;
  is_active: boolean;
  created_at: string;
  meals: MealItem[];
  professional: {
    first_name: string;
    last_name: string;
    phone_number?: string;
    photo_url?: string;
    speciality_new?: {
      name: string;
    };
  };
}
