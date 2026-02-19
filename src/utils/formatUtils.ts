/**
 * Utility functions for formatting values throughout the app
 */

/**
 * Format price with proper null checks and Indian currency symbol
 * @param price - Price value (can be null/undefined)
 * @param fallback - Fallback value when price is null/undefined
 * @returns Formatted price string
 */
export const formatPrice = (price: number | null | undefined, fallback: string = '0'): string => {
  if (price === null || price === undefined) return `₹${fallback}`;
  return `₹${price.toLocaleString()}`;
};

/**
 * Format price with optional discount display
 * @param price - Original price
 * @param discount - Discount amount (optional)
 * @returns Object with formatted strings
 */
export const formatPriceWithDiscount = (
  price: number | null | undefined, 
  discount?: number | null | undefined
) => {
  const formattedPrice = formatPrice(price);
  const formattedDiscount = discount && discount > 0 ? formatPrice(discount) : null;
  const total = price && discount ? price - discount : price;
  const formattedTotal = formatPrice(total);
  
  return {
    price: formattedPrice,
    discount: formattedDiscount,
    total: formattedTotal,
    hasDiscount: !!(discount && discount > 0)
  };
};

/**
 * Format date safely with error handling
 * @param date - Date value (string, Date object, or null/undefined)
 * @param fallback - Fallback value when date is invalid
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date | null | undefined, fallback: string = 'Date not available'): string => {
  if (!date) return fallback;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return dateObj.toLocaleString();
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

/**
 * Format date with options
 * @param date - Date value
 * @param options - Intl.DateTimeFormatOptions
 * @param fallback - Fallback value
 * @returns Formatted date string
 */
export const formatDateWithOptions = (
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  },
  fallback: string = 'Date not available'
): string => {
  if (!date) return fallback;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return dateObj.toLocaleString(undefined, options);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};
