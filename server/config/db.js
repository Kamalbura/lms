import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import logger from '../utils/logger.js';

dotenv.config();

// Initialize a MongoDB server in memory
let mongoServer;

const connectDB = async () => {
  try {
    // Check if we want to use MongoMemoryServer
    if (process.env.USE_MEMORY_DB === 'true') {
      logger.info('Using MongoMemoryServer for in-memory database');
      mongoServer = await MongoMemoryServer.create();
      const mongoURI = mongoServer.getUri();
      logger.info(`MongoMemoryServer started at ${mongoURI}`);
      
      const conn = await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } else {
      // Try to connect to local MongoDB first
      try {
        const localURI = 'mongodb://localhost:27017/lms';
        logger.info('Attempting to connect to local MongoDB');
        
        const conn = await mongoose.connect(localURI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000, // 5 second timeout
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (localError) {
        logger.warn(`Local MongoDB connection failed: ${localError.message}`);
        
        // If local fails and MONGO_URI is defined, try remote connection
        if (process.env.MONGO_URI) {
          logger.info('Attempting to connect to remote MongoDB');
          const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          
          logger.info(`Remote MongoDB Connected: ${conn.connection.host}`);
          return conn;
        } else {
          // If both fail, fall back to MongoMemoryServer
          logger.warn('Falling back to MongoMemoryServer as last resort');
          mongoServer = await MongoMemoryServer.create();
          const mongoURI = mongoServer.getUri();
          
          const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          
          logger.info(`Fallback MongoMemoryServer started at ${mongoURI}`);
          return conn;
        }
      }
    }
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Gracefully close the MongoDB memory server when shutting down
export const closeConnection = async () => {
  if (mongoServer) {
    await mongoose.connection.close();
    await mongoServer.stop();
    logger.info('MongoMemoryServer stopped');
  }
};

export default connectDB;
