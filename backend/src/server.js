import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/db.config.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import wooCommerceRoutes from './routes/wooCommerceRoutes.js';
import excelRoutes from './routes/excelRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    system: 'Stitch PIM Backend Server',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api', categoryRoutes);
app.use('/api/woocommerce', wooCommerceRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/reports', reportRoutes);

// Central Error Handler
app.use(errorHandler);

// Start Server
async function start() {
  console.log('--- Initializing Stitch PIM Backend ---');
  await initializeDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Stitch PIM Backend] Listening on http://0.0.0.0:${PORT}`);
    console.log(`API health endpoint: http://localhost:${PORT}/api/health`);
  });
}

start().catch(err => {
  console.error('Fatal backend startup error:', err);
  process.exit(1);
});
