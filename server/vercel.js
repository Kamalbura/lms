import app from './server.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Add a health check route
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).send({
    status: 'ok',
    environment: process.env.NODE_ENV,
    database: dbStatus[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
    serverTime: new Date().toLocaleString(),
    vercelRegion: process.env.VERCEL_REGION || 'unknown'
  });
});

// Add a warm-up endpoint for better cold starts
app.get('/api/warmup', (req, res) => {
  res.status(200).send({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// Handle options for CORS preflight
app.options('*', (req, res) => {
  res.status(200).end();
});

// This module is for Vercel to use as the serverless function entry point
export default app;
