// src/utils/yogaUtils.ts

// Price calculation utilities
export const calculatePrice = {
  // Calculate total amount for instructor booking
  instructorBooking: (hourlyRate: number, classType: 'one_on_one' | 'group', numberOfSessions: number) => {
    const basePrice = classType === 'group' ? hourlyRate * 0.7 : hourlyRate;
    return basePrice * numberOfSessions;
  },

  // Calculate total amount with platform fee
  withPlatformFee: (baseAmount: number, platformFee: number = 50) => {
    return baseAmount + platformFee;
  },

  // Calculate discount percentage
  discountPercentage: (originalPrice: number, discountedPrice: number) => {
    if (originalPrice <= discountedPrice) return 0;
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  },
};

// Time and date utilities
export const timeUtils = {
  // Format time slot for display
  formatTimeSlot: (day: string, time: string) => {
    return `${day} at ${time}`;
  },

  // Format schedule for display
  formatSchedule: (days: string[], time: string, timezone: string = 'IST') => {
    return `${days.join(', ')} at ${time} (${timezone})`;
  },

  // Check if time slot is available
  isTimeSlotAvailable: (slot: { isAvailable: boolean; type: string }, classType: string) => {
    return slot.isAvailable && slot.type === classType;
  },
};

// UI utilities
export const uiUtils = {
  // Get badge colors
  getBadgeColor: (type: 'popular' | 'recommended' | 'new') => {
    const colors = {
      popular: '#FF9800',
      recommended: '#4CAF50',
      new: '#2196F3',
    };
    return colors[type] || colors.recommended;
  },

  // Get mode badge info
  getModeBadge: (mode: 'online' | 'offline') => {
    return {
      icon: mode === 'online' ? 'video' : 'map-marker',
      color: mode === 'online' ? '#4CAF50' : '#FF9800',
      text: mode === 'online' ? 'Online' : 'Offline',
    };
  },
};

// Validation utilities
export const validation = {
  // Validate booking preferences
  bookingPreferences: (preferences: {
    classType: 'one_on_one' | 'group';
    selectedSlot: any;
    numberOfSessions: number;
  }) => {
    const errors: string[] = [];
    
    if (!preferences.selectedSlot) {
      errors.push('Please select a time slot');
    }
    
    if (preferences.numberOfSessions < 1 || preferences.numberOfSessions > 10) {
      errors.push('Number of sessions must be between 1 and 10');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Validate payment method selection
  paymentMethod: (selectedMethod: string) => {
    return {
      isValid: selectedMethod.length > 0,
      error: selectedMethod.length === 0 ? 'Please select a payment method' : '',
    };
  },
};

// Data transformation utilities
export const dataTransform = {
  // Transform instructor data for card display
  instructorToCardData: (instructor: any) => ({
    title: instructor.name,
    description: instructor.bio,
    price: instructor.hourlyRate,
    icon: 'account',
    stats: [
      { icon: 'star', value: instructor.rating.toString(), label: 'Rating' },
      { icon: 'briefcase', value: `${instructor.experience} years`, label: 'Experience' },
      { icon: 'account-group', value: instructor.totalStudents.toString(), label: 'Students' },
    ],
    features: instructor.specialization,
    variant: 'instructor' as const,
  }),

  // Transform package data for card display
  packageToCardData: (yogaPackage: any) => ({
    title: yogaPackage.title,
    description: yogaPackage.description,
    price: yogaPackage.price,
    originalPrice: yogaPackage.originalPrice,
    icon: 'yoga',
    badge: yogaPackage.isPopular ? { type: 'popular' as const, text: 'Popular' } : 
           yogaPackage.isRecommended ? { type: 'recommended' as const, text: 'Recommended' } : undefined,
    stats: [
      { icon: 'calendar', value: yogaPackage.duration.toString(), label: 'Days' },
      { icon: 'clock', value: yogaPackage.sessionsCount.toString(), label: 'Sessions' },
      { icon: 'account-group', value: `${yogaPackage.currentParticipants}/${yogaPackage.maxParticipants}`, label: 'Enrolled' },
    ],
    features: yogaPackage.features,
    variant: 'package' as const,
  }),
};

// Navigation utilities
export const navigationUtils = {
  // Get route parameters for yoga booking success
  getBookingSuccessParams: (bookingData: {
    instructor?: any;
    professional?: any;
    preferences?: any;
    bookingDetails?: any;
    mode: 'online' | 'offline';
    location?: any;
    package?: any;
  }) => {
    return {
      instructor: bookingData.instructor,
      professional: bookingData.professional,
      preferences: bookingData.preferences,
      bookingDetails: bookingData.bookingDetails,
      bookingId: `BK${Date.now()}`,
      mode: bookingData.mode,
      location: bookingData.location,
      package: bookingData.package,
    };
  },
};
