import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', (_req, res) => {
  res.json({ ready: true });
});

router.get('/live', (_req, res) => {
  res.json({ alive: true });
});

export { router as healthRoutes };
