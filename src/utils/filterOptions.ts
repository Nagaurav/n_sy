// src/utils/filterOptions.ts
import type { DropdownOption } from '../components/common/Dropdown';

// Professional filter sort options (matching API exactly)
export const professionalSortOptions: DropdownOption[] = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'price_low_to_high', label: 'Price: Low to High' },
  { value: 'price_high_to_low', label: 'Price: High to Low' },
  { value: 'distance', label: 'Nearest to Me' }
];

// Gender preference options (matching API exactly)
export const genderOptions: DropdownOption[] = [
  { value: 'all', label: 'All Genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
];

// Duration options (matching API exactly - as strings for backend)
export const professionalDurationOptions: DropdownOption[] = [
  { value: 'all', label: 'Any Duration' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' }
];

// Rating filter options (matching API exactly)
export const ratingOptions: DropdownOption[] = [
  { value: 'all', label: 'All Ratings' },
  { value: '4.5', label: '4.5+ Stars' },
  { value: '4.0', label: '4.0+ Stars' },
  { value: '3.5', label: '3.5+ Stars' },
  { value: '3.0', label: '3.0+ Stars' }
];

// Role options (for professional roles - matching API exactly)
export const professionalRoleOptions: DropdownOption[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'yoga_instructor', label: 'Yoga Instructor' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'dietician', label: 'Dietician' },
  { value: 'ayurveda_practitioner', label: 'Ayurveda Practitioner' },
  { value: 'mental_health_counselor', label: 'Mental Health Counselor' },
  { value: 'homeopath', label: 'Homeopath' },
  { value: 'meditation_guide', label: 'Meditation Guide' },
  { value: 'nutritionist', label: 'Nutritionist' },
  { value: 'naturopath', label: 'Naturopath' },
  { value: 'wellness_coach', label: 'Wellness Coach' },
  { value: 'physiotherapist', label: 'Physiotherapist' },
  { value: 'acupuncturist', label: 'Acupuncturist' },
  { value: 'chiropractor', label: 'Chiropractor' },
  { value: 'massage_therapist', label: 'Massage Therapist' }
];

// Speciality options (for professional specialities - matching API exactly)
export const professionalSpecialityOptions: DropdownOption[] = [
  { value: 'all', label: 'All Specialities' },
  { value: 'hatha_yoga', label: 'Hatha Yoga' },
  { value: 'vinyasa_yoga', label: 'Vinyasa Yoga' },
  { value: 'ashtanga_yoga', label: 'Ashtanga Yoga' },
  { value: 'kundalini_yoga', label: 'Kundalini Yoga' },
  { value: 'yin_yoga', label: 'Yin Yoga' },
  { value: 'restorative_yoga', label: 'Restorative Yoga' },
  { value: 'prenatal_yoga', label: 'Prenatal Yoga' },
  { value: 'stress_management', label: 'Stress Management' },
  { value: 'anxiety_depression', label: 'Anxiety & Depression' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'diabetes_management', label: 'Diabetes Management' },
  { value: 'digestive_health', label: 'Digestive Health' },
  { value: 'skin_conditions', label: 'Skin Conditions' },
  { value: 'joint_pain', label: 'Joint Pain' },
  { value: 'back_pain', label: 'Back Pain' },
  { value: 'sleep_disorders', label: 'Sleep Disorders' },
  { value: 'cardiac_health', label: 'Cardiac Health' },
  { value: 'respiratory_health', label: 'Respiratory Health' },
  { value: 'women_health', label: 'Women\'s Health' },
  { value: 'men_health', label: 'Men\'s Health' },
  { value: 'senior_health', label: 'Senior Health' },
  { value: 'pediatric_health', label: 'Pediatric Health' }
];

// Language options (matching API exactly - single language selection)
export const professionalLanguageOptions: DropdownOption[] = [
  { value: 'all', label: 'All Languages' },
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'punjabi', label: 'Punjabi' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'urdu', label: 'Urdu' },
  { value: 'sanskrit', label: 'Sanskrit' }
];

// Price range presets (for better UX)
export const priceRangePresets: DropdownOption[] = [
  { value: 'all', label: 'All Prices' },
  { value: 'budget', label: 'Budget (₹0 - ₹500)' },
  { value: 'moderate', label: 'Moderate (₹500 - ₹1000)' },
  { value: 'premium', label: 'Premium (₹1000 - ₹2000)' },
  { value: 'luxury', label: 'Luxury (₹2000+)' }
];

// State options for India (matching API exactly)
export const stateOptions: DropdownOption[] = [
  { value: 'all', label: 'All States' },
  { value: 'andhra_pradesh', label: 'Andhra Pradesh' },
  { value: 'arunachal_pradesh', label: 'Arunachal Pradesh' },
  { value: 'assam', label: 'Assam' },
  { value: 'bihar', label: 'Bihar' },
  { value: 'chhattisgarh', label: 'Chhattisgarh' },
  { value: 'goa', label: 'Goa' },
  { value: 'gujarat', label: 'Gujarat' },
  { value: 'haryana', label: 'Haryana' },
  { value: 'himachal_pradesh', label: 'Himachal Pradesh' },
  { value: 'jharkhand', label: 'Jharkhand' },
  { value: 'karnataka', label: 'Karnataka' },
  { value: 'kerala', label: 'Kerala' },
  { value: 'madhya_pradesh', label: 'Madhya Pradesh' },
  { value: 'maharashtra', label: 'Maharashtra' },
  { value: 'manipur', label: 'Manipur' },
  { value: 'meghalaya', label: 'Meghalaya' },
  { value: 'mizoram', label: 'Mizoram' },
  { value: 'nagaland', label: 'Nagaland' },
  { value: 'odisha', label: 'Odisha' },
  { value: 'punjab', label: 'Punjab' },
  { value: 'rajasthan', label: 'Rajasthan' },
  { value: 'sikkim', label: 'Sikkim' },
  { value: 'tamil_nadu', label: 'Tamil Nadu' },
  { value: 'telangana', label: 'Telangana' },
  { value: 'tripura', label: 'Tripura' },
  { value: 'uttar_pradesh', label: 'Uttar Pradesh' },
  { value: 'uttarakhand', label: 'Uttarakhand' },
  { value: 'west_bengal', label: 'West Bengal' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'jammu_kashmir', label: 'Jammu & Kashmir' },
  { value: 'ladakh', label: 'Ladakh' },
  { value: 'chandigarh', label: 'Chandigarh' },
  { value: 'dadra_nagar_haveli', label: 'Dadra & Nagar Haveli' },
  { value: 'daman_diu', label: 'Daman & Diu' },
  { value: 'lakshadweep', label: 'Lakshadweep' },
  { value: 'puducherry', label: 'Puducherry' }
];

// Legacy options (keeping for backward compatibility in other components)
export const availabilityOptions: DropdownOption[] = [
  { value: 'all', label: 'Any Availability' },
  { value: 'available_now', label: 'Available Now' },
  { value: 'available_today', label: 'Available Today' },
  { value: 'available_this_week', label: 'Available This Week' }
];

export const timeSlotOptions: DropdownOption[] = [
  { value: 'all', label: 'All Time Slots' },
  { value: 'morning', label: 'Morning (6AM - 12PM)' },
  { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
  { value: 'evening', label: 'Evening (6PM - 10PM)' },
  { value: 'night', label: 'Night (10PM - 6AM)' }
];

export const sessionTypeOptions: DropdownOption[] = [
  { value: 'all', label: 'All Session Types' },
  { value: 'one_on_one', label: 'One-on-One Session' },
  { value: 'group', label: 'Group Session' }
];

export const priceRangeOptions: DropdownOption[] = [
  { value: 'all', label: 'All Price Ranges' },
  { value: 'low', label: 'Budget Friendly (₹0 - ₹700)' },
  { value: 'medium', label: 'Moderate (₹700 - ₹1000)' },
  { value: 'high', label: 'Premium (₹1000+)' }
];

export const serviceTypeOptions: DropdownOption[] = [
  { value: 'all', label: 'All Services' },
  { value: 'consultation', label: 'Consultations Only' },
  { value: 'classes', label: 'Classes Only' },
  { value: 'both', label: 'Both Consultation & Classes' }
];

export const categoryOptions: DropdownOption[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'dietician', label: 'Dietician' },
  { value: 'ayurveda', label: 'Ayurveda' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'homeopathy', label: 'Homeopathy' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'nutritionist', label: 'Nutritionist' },
  { value: 'naturopath', label: 'Naturopath' }
];

export const appointmentStatusOptions: DropdownOption[] = [
  { value: 'all', label: 'All Appointments' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'ongoing', label: 'In Progress' }
];

export const appointmentTypeOptions: DropdownOption[] = [
  { value: 'all', label: 'All Types' },
  { value: 'consultation', label: 'Consultations' },
  { value: 'class', label: 'Classes' },
  { value: 'therapy', label: 'Therapy Sessions' }
];

export const durationOptions: DropdownOption[] = [
  { value: 'all', label: 'Any Duration' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' }
];

export const experienceOptions: DropdownOption[] = [
  { value: 'all', label: 'Any Experience' },
  { value: '1', label: '1+ Years' },
  { value: '3', label: '3+ Years' },
  { value: '5', label: '5+ Years' },
  { value: '10', label: '10+ Years' }
];

// Yoga class specific filter options (matching backend API exactly)
export const yogaClassDurationOptions: DropdownOption[] = [
  { value: 'all', label: 'All Durations' },
  { value: 'ONE_MONTH', label: '1 Month' },
  { value: 'TWO_MONTHS', label: '2 Months' },
  { value: 'THREE_MONTHS', label: '3 Months' },
  { value: 'SIX_MONTHS', label: '6 Months' },
  { value: 'ONE_YEAR', label: '1 Year' }
];

export const yogaClassSessionTypeOptions: DropdownOption[] = [
  { value: 'all', label: 'All Session Types' },
  { value: 'group_online', label: 'Group Online' },
  { value: 'group_offline', label: 'Group Offline' },
  { value: 'one_to_one_online', label: 'One-to-One Online' },
  { value: 'one_to_one_offline', label: 'One-to-One Offline' },
  { value: 'home_visit', label: 'Home Visit' }
];

export const yogaClassGenderFocusOptions: DropdownOption[] = [
  { value: 'all', label: 'All Genders' },
  { value: 'male', label: 'Male Only' },
  { value: 'female', label: 'Female Only' }
];

export const yogaClassDiseaseOptions: DropdownOption[] = [
  { value: 'all', label: 'All Classes' },
  { value: 'Back Pain', label: 'Back Pain' },
  { value: 'Stress Management', label: 'Stress Management' },
  { value: 'Weight Loss', label: 'Weight Loss' },
  { value: 'Flexibility', label: 'Flexibility' },
  { value: 'Strength Building', label: 'Strength Building' },
  { value: 'Cardiac Health', label: 'Cardiac Health' },
  { value: 'Respiratory Health', label: 'Respiratory Health' },
  { value: 'Joint Pain', label: 'Joint Pain' },
  { value: 'Sleep Disorders', label: 'Sleep Disorders' },
  { value: 'Diabetes Management', label: 'Diabetes Management' },
  { value: 'Hypertension', label: 'Hypertension' },
  { value: 'Digestive Health', label: 'Digestive Health' },
  { value: 'Women\'s Health', label: 'Women\'s Health' },
  { value: 'Senior Health', label: 'Senior Health' },
  { value: 'Prenatal Yoga', label: 'Prenatal Yoga' },
  { value: 'Postnatal Yoga', label: 'Postnatal Yoga' }
];

export const yogaClassDaysOptions: DropdownOption[] = [
  { value: 'all', label: 'All Days' },
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' }
];

export const yogaClassPriceRangeOptions: DropdownOption[] = [
  { value: 'all', label: 'All Prices' },
  { value: 'budget', label: 'Budget (₹0 - ₹500)' },
  { value: 'moderate', label: 'Moderate (₹500 - ₹1000)' },
  { value: 'premium', label: 'Premium (₹1000 - ₹2000)' },
  { value: 'luxury', label: 'Luxury (₹2000+)' }
];
