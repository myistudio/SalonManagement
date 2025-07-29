import { getISTDateTime } from '../utils/timezone';

// Middleware to add IST timestamps to request data
export function addISTTimestamps(req: any, res: any, next: any) {
  const istTimestamp = getISTDateTime();
  
  // Add IST timestamp to request body if it contains data to be created/updated
  if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
    if (!req.body.createdAt && req.method === 'POST') {
      req.body.createdAt = istTimestamp;
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      req.body.updatedAt = istTimestamp;
    }
  }
  
  next();
}

// Add IST timezone info to response headers
export function addTimezoneHeaders(req: any, res: any, next: any) {
  res.set('X-Timezone', 'Asia/Kolkata');
  res.set('X-Server-Time', getISTDateTime());
  next();
}