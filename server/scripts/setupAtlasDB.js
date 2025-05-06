import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

// MongoDB Atlas connection string
const MONGO_URI = 'mongodb+srv://kamal:kamal123@lms.r7f5ghe.mongodb.net/?retryWrites=true&w=majority&appName=lms';

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Create default admin user
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@prolearn.com',
        password: 'admin123', // This will be hashed automatically by pre-save hook
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Default admin user created');
      return adminUser;
    } else {
      console.log('Admin user already exists');
      return adminExists;
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

// Create default instructor user
const createInstructorUser = async () => {
  try {
    const instructorExists = await User.findOne({ role: 'instructor' });
    
    if (!instructorExists) {
      const instructorUser = new User({
        name: 'John Instructor',
        email: 'instructor@prolearn.com',
        password: 'instructor123', // This will be hashed automatically by pre-save hook
        role: 'instructor'
      });
      
      await instructorUser.save();
      console.log('Default instructor user created');
      return instructorUser;
    } else {
      console.log('Instructor user already exists');
      return instructorExists;
    }
  } catch (error) {
    console.error('Error creating instructor user:', error);
    throw error;
  }
};

// Create default student user
const createStudentUser = async () => {
  try {
    const studentExists = await User.findOne({ role: 'student' });
    
    if (!studentExists) {
      const studentUser = new User({
        name: 'Jane Student',
        email: 'student@prolearn.com',
        password: 'student123', // This will be hashed automatically by pre-save hook
        role: 'student'
      });
      
      await studentUser.save();
      console.log('Default student user created');
      return studentUser;
    } else {
      console.log('Student user already exists');
      return studentExists;
    }
  } catch (error) {
    console.error('Error creating student user:', error);
    throw error;
  }
};

// Initialize database
const initializeDB = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Setting up database schema and users...');
    
    // Create default users
    const admin = await createAdminUser();
    const instructor = await createInstructorUser();
    const student = await createStudentUser();
    
    console.log('Database setup complete!');
    console.log('Sample user credentials:');
    console.log('- Admin: admin@prolearn.com / admin123');
    console.log('- Instructor: instructor@prolearn.com / instructor123');
    console.log('- Student: student@prolearn.com / student123');
    
    // Disconnect
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
};

// Run initialization
initializeDB();