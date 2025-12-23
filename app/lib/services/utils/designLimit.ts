/**
 * Utility functions for tracking daily design generation limits
 */

const STORAGE_KEY = 'daily_design_generations';
const DAILY_LIMIT = 5;

interface DesignGenerationData {
  date: string; // ISO date string (YYYY-MM-DD)
  count: number;
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get current design generation count for today
 */
export function getTodayDesignCount(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 0;

    const data: DesignGenerationData = JSON.parse(stored);
    const today = getTodayDateString();

    // If stored date is not today, reset count
    if (data.date !== today) {
      return 0;
    }

    return data.count || 0;
  } catch (error) {
    console.error('Error reading design count:', error);
    return 0;
  }
}

/**
 * Increment design generation count for today
 */
export function incrementDesignCount(): void {
  if (typeof window === 'undefined') return;

  try {
    const today = getTodayDateString();
    const currentCount = getTodayDesignCount();

    const data: DesignGenerationData = {
      date: today,
      count: currentCount + 1
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error incrementing design count:', error);
  }
}

/**
 * Check if user can generate more designs today
 */
export function canGenerateDesign(): boolean {
  return getTodayDesignCount() < DAILY_LIMIT;
}

/**
 * Get remaining design generations for today
 */
export function getRemainingDesigns(): number {
  const count = getTodayDesignCount();
  return Math.max(0, DAILY_LIMIT - count);
}

/**
 * Get the daily limit
 */
export function getDailyLimit(): number {
  return DAILY_LIMIT;
}

