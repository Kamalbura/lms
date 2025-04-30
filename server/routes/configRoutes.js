import express from "express";
import { getSystemConfig } from "../controllers/configController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ensure only admins can access the configuration dashboard
router.get("/", protect, restrictTo("admin"), getSystemConfig);

// Additional endpoints for specific diagnostics could be added here
router.get("/memory", protect, restrictTo("admin"), (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    rss: formatBytes(memUsage.rss),
    heapTotal: formatBytes(memUsage.heapTotal),
    heapUsed: formatBytes(memUsage.heapUsed),
    external: formatBytes(memUsage.external),
    arrayBuffers: formatBytes(memUsage.arrayBuffers || 0)
  });
});

router.get("/database", protect, restrictTo("admin"), async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const status = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      status: status[dbState] || 'unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.models)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
