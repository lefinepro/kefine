import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { loadSimpleApiConfig } from '@kefine/config';
import { taskRoutes } from './routes/tasks.js';
import { healthRoutes } from './routes/health.js';
import { errorHandler } from './middleware/error.js';
import { requestLogger } from './middleware/logger.js';

const config = loadSimpleApiConfig();

const app = express();

// Security headers
if (config.enableHelmet) {
  app.use(helmet());
}

// CORS
app.use(cors({ origin: config.allowedOrigins }));

// Body parsing
app.use(express.json());

// Request logging and ID injection
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);
app.use('/api/tasks', taskRoutes);

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, config.host, () => {
  console.log(`Simple API running on http://${config.host}:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
