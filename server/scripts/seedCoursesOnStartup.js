// filepath: c:\Users\burak\Desktop\projects\lms\server\scripts\seedCoursesOnStartup.js
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Sample courses data - directly imported from your seeding script
const sampleCoursesData = [
  {
    title: "Introduction to Web Development",
    slug: "intro-web-dev",
    description: "Learn the basics of HTML, CSS, and JavaScript to build modern websites.",
    category: "CSE",
    duration: 30,
    level: "Beginner",
    price: 49.99,
    isPublished: true,
    modules: [
      {
        title: "HTML Fundamentals",
        lessons: [
          {
            title: "Introduction to HTML",
            content: "Learn what HTML is and how it structures web content.",
            duration: 10
          },
          {
            title: "Common HTML Tags",
            content: "Explore the most commonly used HTML tags and their purposes.",
            duration: 15
          }
        ]
      },
      {
        title: "CSS Styling",
        lessons: [
          {
            title: "CSS Basics",
            content: "Learn how to style HTML elements with CSS.",
            duration: 12
          },
          {
            title: "CSS Layout",
            content: "Master flexbox and grid layouts for responsive design.",
            duration: 18
          }
        ]
      }
    ]
  },
  {
    title: "JavaScript Masterclass",
    slug: "javascript-masterclass",
    description: "Become a JavaScript expert with advanced techniques and patterns.",
    category: "CSE",
    duration: 45,
    level: "Intermediate",
    price: 79.99,
    isPublished: true,
    modules: [
      {
        title: "JavaScript Fundamentals",
        lessons: [
          {
            title: "Variables and Data Types",
            content: "Understanding JavaScript's dynamic typing system.",
            duration: 15
          },
          {
            title: "Functions and Scope",
            content: "Learn about function declarations, expressions, and lexical scope.",
            duration: 20
          }
        ]
      },
      {
        title: "Advanced JavaScript",
        lessons: [
          {
            title: "Closures and Prototypes",
            content: "Master these core JavaScript concepts for better code.",
            duration: 25
          },
          {
            title: "Asynchronous JavaScript",
            content: "Understand Promises, async/await, and handling asynchronous operations.",
            duration: 30
          }
        ]
      }
    ]
  },
  {
    title: "React.js for Beginners",
    slug: "react-beginners",
    description: "Learn React.js from scratch and build modern frontend applications.",
    category: "CSE",
    duration: 40,
    level: "Beginner",
    price: 69.99,
    isPublished: true,
    modules: [
      {
        title: "React Basics",
        lessons: [
          {
            title: "Introduction to Components",
            content: "Understanding the component-based architecture of React.",
            duration: 15
          },
          {
            title: "State and Props",
            content: "Learn how to manage data flow in React applications.",
            duration: 20
          }
        ]
      },
      {
        title: "React Hooks",
        lessons: [
          {
            title: "useState and useEffect",
            content: "Master the most commonly used React hooks.",
            duration: 25
          },
          {
            title: "Custom Hooks",
            content: "Learn to create reusable hook logic for your applications.",
            duration: 22
          }
        ]
      }
    ]
  }
];

// Create a default admin user if none exists
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
      logger.info('Default admin user created');
      return adminUser;
    } else {
      logger.info('Admin user already exists');
      return adminExists;
    }
  } catch (error) {
    logger.error('Error creating admin user:', error);
    throw error;
  }
};

// Create an instructor user if none exists
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
      logger.info('Default instructor user created');
      return instructorUser;
    } else {
      logger.info('Instructor user already exists');
      return instructorExists;
    }
  } catch (error) {
    logger.error('Error creating instructor user:', error);
    throw error;
  }
};

// Create a student user if none exists
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
      logger.info('Default student user created');
      return studentUser;
    } else {
      logger.info('Student user already exists');
      return studentExists;
    }
  } catch (error) {
    logger.error('Error creating student user:', error);
    throw error;
  }
};

// Seed courses function designed to be called at server startup
const seedCourses = async () => {
  try {
    // Check for existing courses
    const courseCount = await Course.countDocuments();
    if (courseCount > 0) {
      logger.info(`Database already has ${courseCount} courses, skipping auto-seed`);
      return;
    }
    
    // Create default users
    const admin = await createAdminUser();
    const instructor = await createInstructorUser();
    await createStudentUser();
    
    // Get existing slugs to avoid duplicates
    const existingSlugs = new Set();
    
    // Process courses to ensure valid slugs
    const processedCourses = sampleCoursesData.map(course => {
      // Generate slug from title if not present or is invalid
      if (!course.slug || typeof course.slug !== 'string' || course.slug.trim() === '') {
        course.slug = course.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      
      // Ensure slug uniqueness by adding timestamp if already exists
      let baseSlug = course.slug;
      let slugCounter = 0;
      while (existingSlugs.has(course.slug)) {
        slugCounter++;
        course.slug = `${baseSlug}-${slugCounter}`;
      }
      
      // Add to set of existing slugs
      existingSlugs.add(course.slug);
      
      return {
        ...course,
        instructor: instructor._id
      };
    });
    
    // Insert courses one by one to handle any errors
    let successCount = 0;
    let errorCount = 0;
    
    for (const course of processedCourses) {
      try {
        await Course.create(course);
        successCount++;
      } catch (error) {
        errorCount++;
        logger.error(`Error auto-seeding course "${course.title}": ${error.message}`);
        
        // If it's a duplicate slug error, try again with a timestamp suffix
        if (error.code === 11000 && error.message.includes('slug')) {
          try {
            course.slug = `${course.slug}-${Date.now()}`;
            await Course.create(course);
            logger.info(`Recovered course "${course.title}" with modified slug: ${course.slug}`);
            successCount++;
            errorCount--;
          } catch (retryError) {
            logger.error(`Failed retry for course "${course.title}": ${retryError.message}`);
          }
        }
      }
    }
    
    logger.info(`Auto-seed completed: ${successCount} courses added (errors: ${errorCount})`);
    logger.info(`Sample logins created: 
      - Admin: admin@prolearn.com / admin123
      - Instructor: instructor@prolearn.com / instructor123
      - Student: student@prolearn.com / student123`);
    
  } catch (error) {
    logger.error(`Error in auto-seed process: ${error.message}`);
    throw error;
  }
};

export default seedCourses;