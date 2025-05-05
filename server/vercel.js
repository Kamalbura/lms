import app from './server.js';

// Add a health check route
app.get('/health', (req, res) => {
  res.status(200).send({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// This module is for Vercel to use as the serverless function entry point
export default app;
