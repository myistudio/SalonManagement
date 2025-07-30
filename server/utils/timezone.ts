// IST Timezone utility functions using proper timezone handling
export function getISTDate(date?: Date): Date {
  const baseDate = date || new Date();
  // Use proper timezone conversion instead of manual offset
  return new Date(baseDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

export function getISTDateString(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // Returns YYYY-MM-DD format
}

export function getISTTimeString(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }); // Returns HH:MM:SS format
}

export function getISTDateTime(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }); // Returns YYYY-MM-DD HH:MM:SS format
}

export function formatISTDate(date: Date | string, format: 'date' | 'time' | 'datetime' = 'datetime'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'date':
      return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    case 'time': 
      return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
    case 'datetime':
      return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    default:
      return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  }
}