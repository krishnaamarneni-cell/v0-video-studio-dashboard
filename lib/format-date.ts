import { format as formatDate, isValid } from 'date-fns'

/**
 * Safely format a date string or Date object
 * Returns 'Just now' if the date is invalid, null, or undefined
 */
export function formatSafeDate(
  date: string | Date | null | undefined,
  formatString: string = 'MMM dd, HH:mm'
): string {
  if (!date) return 'Just now'

  try {
    let dateObj: Date
    
    if (typeof date === 'string') {
      dateObj = new Date(date)
    } else {
      dateObj = date
    }

    if (!isValid(dateObj) || isNaN(dateObj.getTime())) {
      return 'Just now'
    }

    return formatDate(dateObj, formatString)
  } catch {
    return 'Just now'
  }
}
