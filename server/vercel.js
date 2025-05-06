import app from './server.js';
import mongoose from 'mongoose';

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
    dbHost: mongoose.connection.host || 'not connected',
    timestamp: new Date().toISOString()
  });
});

// This module is for Vercel to use as the serverless function entry point
export default app;
