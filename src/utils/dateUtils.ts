// src/utils/dateUtils.ts
/**
 * Unified date/time utilities for consistent formatting across the app
 * Uses 'en-IN' locale to ensure consistency regardless of user device settings
 */

export const formatDisplayDate = (dateString: string) => {
  try {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string for formatDisplayDate:', dateString);
      return dateString;
    }
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error in formatDisplayDate:', error, 'for input:', dateString);
    return dateString;
  }
};

export const formatDisplayTime = (timeString: any) => {
  if (!timeString) return 'N/A';
  
  // If it's already a formatted range (like "1:30 pm - 3:00 pm"), return as is
  if (typeof timeString === 'string' && (timeString.includes('am') || timeString.includes('pm'))) {
    return timeString;
  }

  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString; // Fallback to raw string if invalid
    
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return timeString;
  }
};

export const formatSlotTimeRange = (start: string, end: string) => {
  try {
    const startTime = formatDisplayTime(start);
    const endTime = formatDisplayTime(end);
    return `${startTime} - ${endTime}`;
  } catch (error) {
    console.error('Error in formatSlotTimeRange:', error, 'for inputs:', start, end);
    return `${start} - ${end}`;
  }
};

// Additional utility for short date format (like in SelectTimeScreen)
export const formatShortDate = (dateString: string) => {
  try {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string for formatShortDate:', dateString);
      return dateString;
    }
    
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error in formatShortDate:', error, 'for input:', dateString);
    return dateString;
  }
};

// Utility to format date for calendar headers
export const formatCalendarDate = (dateString: string) => {
  try {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string for formatCalendarDate:', dateString);
      return dateString;
    }
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch (error) {
    console.error('Error in formatCalendarDate:', error, 'for input:', dateString);
    return dateString;
  }
};
