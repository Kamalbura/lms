import mongoose from "mongoose";
import os from "os";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import express from "express"; // Added missing import

export const getSystemConfig = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState; // 1 = connected
    
    // Get database statistics
    const [userCount, courseCount, enrollCount] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
    ]);

    // Get loaded routes - fixed missing app reference by using Router stack analysis
    const routes = [];
    // Get routes from req.app if available (a cleaner solution than directly referencing a global app)
    if (req.app && req.app._router) {
      req.app._router.stack.forEach(middleware => {
        if (middleware.route) {
          routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods)
          });
        } else if (middleware.name === 'router') {
          middleware.handle.stack.forEach(handler => {
            if (handler.route) {
              routes.push({
                path: handler.route.path,
                methods: Object.keys(handler.route.methods)
              });
            }
          });
        }
      });
    }

    // System resource usage
    const memoryUsage = process.memoryUsage();
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpus: os.cpus().length,
      totalMemory: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
      freeMemory: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
    };

    res.json({
      app: "ProLearn LMS",
      environment: process.env.NODE_ENV || "development",
      database: {
        status: dbState === 1 ? "connected" : "disconnected",
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        port: mongoose.connection.port
      },
      statistics: {
        users: userCount,
        courses: courseCount,
        enrollments: enrollCount
      },
      system: {
        uptime: formatUptime(process.uptime()),
        serverUptime: formatUptime(os.uptime()),
        memory: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external)
        },
        systemInfo
      },
      timestamp: new Date(),
      routes: routes.length > 0 ? routes : "Route extraction unavailable"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching system configuration",
      code: 500,
      error: error.message
    });
  }
};

// Helper functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  seconds %= 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
