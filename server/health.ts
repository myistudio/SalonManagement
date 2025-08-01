import { Router } from 'express';
import { db } from './db';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.execute('SELECT 1');
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    
    const healthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      database: 'disconnected'
    };
    
    res.status(503).json(healthStatus);
  }
});

export default router;