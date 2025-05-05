import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Course from '../models/Course.js';
import logger from '../utils/logger.js';

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
    // Try connecting to fallback database if main connection fails
    try {
      console.log('Attempting to connect to fallback database...');
      const fallbackConn = await mongoose.connect('mongodb://localhost:27017/lms_fallback', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`Connected to fallback database: ${fallbackConn.connection.host}`);
      return fallbackConn;
    } catch (fallbackError) {
      console.error(`Fallback connection failed: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

// Load course data from multiple sources with fallback
const loadCourseData = () => {
  // Define possible course data file paths in order of preference
  const possiblePaths = [
    path.join(__dirname, 'courses.json'),
    path.join(__dirname, '../data/courses.json'),
    path.join(__dirname, '../backups/courses.json'),
    path.join(__dirname, '../../data/courses.json')
  ];

  let courseData = null;
  let usedPath = null;

  // Try each path until we find a valid file
  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf8');
        courseData = JSON.parse(rawData);
        usedPath = filePath;
        console.log(`Successfully loaded course data from: ${filePath}`);
        break;
      }
    } catch (error) {
      console.warn(`Failed to load from ${filePath}: ${error.message}`);
    }
  }

  // If no files were found, use hardcoded fallback data
  if (!courseData) {
    console.warn('No course data files found. Using minimal fallback data.');
    courseData = [
      {
        title: "Fallback Introduction Course",
        description: "This is a fallback course that appears when no course data can be loaded.",
        category: "CSE",
        duration: 30,
        level: "Beginner",
        price: 0,
        isPublished: true,
        modules: [
          {
            title: "Getting Started",
            lessons: [
              {
                title: "Welcome",
                content: "Welcome to this fallback course. This content is displayed when the system cannot load regular courses.",
                duration: 5
              }
            ]
          }
        ]
      }
    ];
  }

  return { courseData, usedPath };
};

// Import courses with validation and error handling
const importCoursesWithFallback = async () => {
  try {
    // Connect to database
    await connectDB();

    // Get course data
    const { courseData, usedPath } = loadCourseData();

    // Check if we have courses to import
    if (!courseData || !Array.isArray(courseData) || courseData.length === 0) {
      throw new Error('No valid course data available for import');
    }

    console.log(`Attempting to import ${courseData.length} courses`);

    // Check if collection is empty before importing
    const existingCount = await Course.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already contains ${existingCount} courses. Skipping import.`);
      return;
    }

    // Track success and failures
    const results = {
      success: [],
      failures: []
    };

    // Process each course
    for (const course of courseData) {
      try {
        // Validate minimum required fields
        if (!course.title || !course.description) {
          throw new Error('Course missing required fields (title or description)');
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

    // Create fallback courses if all imports failed
    if (results.success.length === 0 && results.failures.length > 0) {
      console.log('All imports failed. Creating emergency fallback course...');
      await createFallbackCourse();
    }

  } catch (error) {
    console.error(`Import process error: ${error.message}`);
    // Create emergency fallback course in case of critical failure
    await createFallbackCourse();
  } finally {
    // Close connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Create an emergency fallback course if everything else fails
const createFallbackCourse = async () => {
  try {
    const fallbackCourse = {
      title: "Emergency Fallback Course",
      slug: "emergency-fallback-course",
      description: "This course was automatically created because the system couldn't load any other courses.",
      category: "CSE",
      duration: 10,
      level: "Beginner",
      price: 0,
      isPublished: true,
      modules: [
        {
          title: "System Recovery",
          lessons: [
            {
              title: "Contact Support",
              content: "Please contact system administrators for assistance with the course catalog.",
              duration: 5
            }
          ]
        }
      ]
    };

    await Course.create(fallbackCourse);
    console.log('Emergency fallback course created successfully');
  } catch (error) {
    console.error(`Failed to create emergency fallback course: ${error.message}`);
  }
};

// Run the import
importCoursesWithFallback().catch(error => {
  console.error('Critical error in import process:', error);
  process.exit(1);
});
