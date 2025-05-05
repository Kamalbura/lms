import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Course from '../models/Course.js';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms', {
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

// Function to load course data from JSON file
const loadCoursesFromJSON = () => {
  try {
    // Try to load from data directory first
    const filePath = path.join(__dirname, '../data/courses.json');
    
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(rawData);
    } else {
      console.error('Courses data file not found at:', filePath);
      return null;
    }
  } catch (error) {
    console.error('Error loading course data:', error);
    return null;
  }
};

// Import courses to database
const importCourses = async () => {
  try {
    // Connect to database
    await connectDB();

    // Get course data
    const courseData = loadCoursesFromJSON();

    // Check if we have courses to import
    if (!courseData || !Array.isArray(courseData) || courseData.length === 0) {
      throw new Error('No valid course data available for import');
    }

    console.log(`Attempting to import ${courseData.length} courses`);

    // Check if collection is empty before importing
    const existingCount = await Course.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already contains ${existingCount} courses.`);
      const shouldContinue = process.argv.includes('--force');
      
      if (!shouldContinue) {
        console.log('Use --force flag to override existing courses.');
        return;
      } else {
        console.log('Forcing import and replacing existing courses...');
        await Course.deleteMany({});
      }
    }

    // Track success and failures
    const results = {
      success: [],
      failures: []
    };

    // Special handling for instructor field
    // Since we don't have actual instructor IDs, we'll use a placeholder
    // You'll need to update these with real instructor IDs later
    const defaultInstructorId = '60f6f9e2f9a1234567890abc'; // placeholder

    // Process each course
    for (const course of courseData) {
      try {
        // Set a default instructor if not provided
        if (!course.instructor) {
          course.instructor = defaultInstructorId;
        }

        // Create slug if not provided
        if (!course.slug) {
          course.slug = course.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }

        // Insert the course
        const newCourse = await Course.create(course);
        results.success.push({
          id: newCourse._id,
          title: newCourse.title
        });
      } catch (error) {
        results.failures.push({
          course: course.title,
          error: error.message
        });
      }
    }

    // Log results
    console.log(`Import complete: ${results.success.length} successful, ${results.failures.length} failed`);
    
    // Log details of failures
    if (results.failures.length > 0) {
      console.log('Failed imports:');
      results.failures.forEach(failure => {
        console.log(`- ${failure.course}: ${failure.error}`);
      });
    }

  } catch (error) {
    console.error(`Import process error: ${error.message}`);
  } finally {
    // Close connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the import
importCourses();
