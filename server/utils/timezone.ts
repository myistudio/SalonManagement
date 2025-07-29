// IST Timezone utility functions
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30

export function getISTDate(date?: Date): Date {
  const baseDate = date || new Date();
  return new Date(baseDate.getTime() + IST_OFFSET);
}

export function getISTDateString(date?: Date): string {
  return getISTDate(date).toISOString().split('T')[0];
}

export function getISTTimeString(date?: Date): string {
  const istDate = getISTDate(date);
  return istDate.toISOString().split('T')[1].split('.')[0];
}

export function getISTDateTime(date?: Date): string {
  return getISTDate(date).toISOString().replace('T', ' ').split('.')[0];
}

export function formatISTDate(date: Date | string, format: 'date' | 'time' | 'datetime' = 'datetime'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const istDate = getISTDate(d);
  
  switch (format) {
    case 'date':
      return istDate.toLocaleDateString('en-IN');
    case 'time': 
      return istDate.toLocaleTimeString('en-IN');
    case 'datetime':
      return istDate.toLocaleString('en-IN');
    default:
      return istDate.toLocaleString('en-IN');
  }
}