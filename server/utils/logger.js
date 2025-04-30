import winston from 'winston';
import path from 'path';
import fs from 'fs';
import 'winston-daily-rotate-file';

// Ensure logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}${info.metadata ? '\nMetadata: ' + JSON.stringify(info.metadata) : ''}`
  )
);

// Configure rotating file transports
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
});

const errorFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error'
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'prolearn-lms' },
  transports: [
    // Write all logs with importance level of 'error' or less to 'error.log'
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    // Write all logs with importance level of 'info' or less to 'combined.log'
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    // Add rotating file transports
    fileRotateTransport,
    errorFileRotateTransport
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
  ]
});

// If we're not in production then log to the console too
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create a stream object with a 'write' function
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Add context-specific logging methods for better categorization
logger.course = {
  create: (courseData, userId) => {
    logger.info(`Course created: ${courseData.title}`, { 
      metadata: { 
        action: 'course_create', 
        courseId: courseData._id,
        instructorId: userId
      } 
    });
  },
  update: (courseId, slug, userId) => {
    logger.info(`Course updated: ${slug}`, { 
      metadata: { 
        action: 'course_update', 
        courseId,
        instructorId: userId
      } 
    });
  },
  delete: (courseId, slug, userId) => {
    logger.warn(`Course deleted: ${slug}`, { 
      metadata: { 
        action: 'course_delete', 
        courseId,
        instructorId: userId
      } 
    });
  },
  view: (courseId, slug, userId = null) => {
    logger.debug(`Course viewed: ${slug}`, { 
      metadata: { 
        action: 'course_view', 
        courseId,
        userId
      } 
    });
  }
};

// Add enrollment logging
logger.enrollment = {
  create: (enrollmentData) => {
    logger.info(`User enrolled in course`, { 
      metadata: { 
        action: 'enrollment_create', 
        enrollmentId: enrollmentData._id,
        userId: enrollmentData.user,
        courseId: enrollmentData.course
      } 
    });
  },
  progress: (enrollmentId, userId, courseId, progress) => {
    logger.debug(`Enrollment progress updated`, { 
      metadata: { 
        action: 'enrollment_progress', 
        enrollmentId,
        userId,
        courseId,
        progress
      } 
    });
  }
};

// Express middleware for request logging
logger.requestLogger = (req, res, next) => {
  const startHrTime = process.hrtime();
  
  // Once the request is finished
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedTimeInMs.toFixed(3)}ms`, {
      metadata: {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        responseTime: elapsedTimeInMs.toFixed(3),
        ip: req.ip,
        userId: req.user ? req.user._id : null
      }
    });
  });
  
  next();
};

export default logger;
