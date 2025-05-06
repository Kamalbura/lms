import mongoose from 'mongoose';
import os from 'os';
import logger from './logger.js';

// Enhanced health check utility
export const getSystemHealth = async () => {
  // Check MongoDB connection
  const dbState = mongoose.connection.readyState;
  const dbStatuses = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  // Get memory metrics
  const memoryUsage = process.memoryUsage();
  const memoryMetrics = {
    rss: formatBytes(memoryUsage.rss),
    heapTotal: formatBytes(memoryUsage.heapTotal),
    heapUsed: formatBytes(memoryUsage.heapUsed),
    external: formatBytes(memoryUsage.external),
    percentUsed: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
  };
  
  // Get CPU load
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const cpuUsage = {
    idle: totalIdle / cpus.length,
    total: totalTick / cpus.length,
    percentUsed: Math.round(100 - ((totalIdle / totalTick) * 100))
  };
  
  // System info
  const systemInfo = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    uptime: formatUptime(process.uptime()),
    serverUptime: formatUptime(os.uptime()),
    totalMemory: formatBytes(os.totalmem()),
    freeMemory: formatBytes(os.freemem()),
    cpuCount: cpus.length
  };
  
  // MongoDB metrics if connected
  let dbMetrics = { status: dbStatuses[dbState] || 'unknown' };
  
  if (dbState === 1) {
    try {
      // Add additional MongoDB metrics if needed
      dbMetrics = {
        ...dbMetrics,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        port: mongoose.connection.port
      };
    } catch (error) {
      logger.error('Error getting MongoDB metrics', error);
    }
  }
  
  return {
    status: dbState === 1 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    region: process.env.VERCEL_REGION || 'unknown',
    database: dbMetrics,
    memory: memoryMetrics,
    cpu: cpuUsage,
    system: systemInfo
  };
};

// Helper functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

export default getSystemHealth;
