import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format time from HH:mm to a readable format
 */
export function formatTime(time: string): string {
  if (!time) return ''
  
  try {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const min = parseInt(minutes, 10)
    
    if (isNaN(hour) || isNaN(min)) return time
    
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    
    return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`
  } catch {
    return time
  }
}

/**
 * Format date from YYYY-MM-DD to a readable format
 */
export function formatDate(date: string): string {
  if (!date) return ''
  
  try {
    const dateObj = new Date(date + 'T00:00:00')
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return date
  }
}
