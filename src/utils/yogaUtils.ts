import { YogaPlan, YogaPlanDuration, SessionMode } from '../types/yogaPlan';

/**
 * Parse comma-separated days string into array of days
 */
export function parseDays(daysString: string): string[] {
  return daysString.split(',').map(day => day.trim());
}

/**
 * Parse comma-separated languages string into array of languages
 */
export function parseLanguages(languagesString: string): string[] {
  return languagesString.split(',').map(lang => lang.trim());
}

/**
 * Format time from ISO string to readable format
 */
export function formatTimeFromISO(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Get available session modes for a yoga plan
 */
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

/**
 * Format duration enum to readable string
 */
export function formatDuration(duration: YogaPlanDuration | string): string {
  switch (duration) {
    case 'ONE_MONTH':
      return '1 Month';
    case 'THREE_MONTHS':
      return '3 Months';
    case 'SIX_MONTHS':
      return '6 Months';
    case 'ONE_YEAR':
      return '1 Year';
    default:
      return duration;
  }
}

/**
 * Get the lowest price from available session modes
 */
export function getLowestPrice(plan: YogaPlan): number | null {
  const prices = [
    plan.price_group_online,
    plan.price_group_offline,
    plan.price_one_to_one_online,
    plan.price_one_to_one_offline,
    plan.price_home_visit
  ].filter(price => price !== null && price > 0) as number[];

  return prices.length > 0 ? Math.min(...prices) : null;
}

/**
 * Check if a plan has any available session modes
 */
export function hasAvailableSessions(plan: YogaPlan): boolean {
  return plan.group_online || 
         plan.group_offline || 
         plan.one_to_one_online || 
         plan.one_to_one_offline || 
         plan.home_visit;
}

/**
 * Get session mode label by type
 */
export function getSessionModeLabel(type: SessionMode['type']): string {
  switch (type) {
    case 'group_online':
      return 'Group Online';
    case 'group_offline':
      return 'Group Offline';
    case 'one_to_one_online':
      return 'One-to-One Online';
    case 'one_to_one_offline':
      return 'One-to-One Offline';
    case 'home_visit':
      return 'Home Visit';
    default:
      return type;
  }
}
