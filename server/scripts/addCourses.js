import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';

// Load environment variables
dotenv.config();

// MongoDB connection string - adjust as needed
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Course data - 30 courses across different categories
const courses = [
  // CSE Courses
  {
    title: "Advanced Data Structures",
    description: "Learn advanced data structures and algorithms for efficient problem solving.",
    category: "CSE",
    duration: 45,
    level: "Advanced",
    price: 59.99,
    isPublished: true
  },
  {
    title: "Web Development Bootcamp",
    description: "Comprehensive course on modern web development technologies including HTML, CSS, JavaScript, and frameworks.",
    category: "CSE",
    duration: 60,
    level: "Intermediate",
    price: 79.99,
    isPublished: true
  },
  {
    title: "Machine Learning Fundamentals",
    description: "Introduction to machine learning concepts, algorithms and practical applications.",
    category: "CSE",
    duration: 50,
    level: "Intermediate",
    price: 89.99,
    isPublished: true
  },
  {
    title: "Database Management Systems",
    description: "Learn about database design, SQL, and database administration.",
    category: "CSE",
    duration: 40,
    level: "Beginner",
    price: 49.99,
    isPublished: true
  },
  {
    title: "Cloud Computing Architecture",
    description: "Understanding cloud computing platforms, services, and deployment models.",
    category: "CSE",
    duration: 35,
    level: "Intermediate",
    price: 69.99,
    isPublished: true
  },
  {
    title: "Cybersecurity Essentials",
    description: "Learn about cybersecurity threats, vulnerabilities, and protection mechanisms.",
    category: "CSE",
    duration: 30,
    level: "Beginner",
    price: 59.99,
    isPublished: true
  },
  
  // IoT Courses
  {
    title: "IoT Fundamentals",
    description: "Introduction to Internet of Things concepts, architecture, and applications.",
    category: "IoT",
    duration: 30,
    level: "Beginner",
    price: 49.99,
    isPublished: true
  },
  {
    title: "IoT Sensor Networks",
    description: "Working with various sensors, sensor fusion, and wireless sensor networks for IoT.",
    category: "IoT",
    duration: 35,
    level: "Intermediate",
    price: 59.99,
    isPublished: true
  },
  {
    title: "IoT Security",
    description: "Understanding security challenges and implementing secure IoT systems.",
    category: "IoT",
    duration: 40,
    level: "Advanced",
    price: 69.99,
    isPublished: true
  },
  {
    title: "IoT Protocol Stack",
    description: "Detailed study of communication protocols used in IoT systems.",
    category: "IoT",
    duration: 45,
    level: "Intermediate",
    price: 64.99,
    isPublished: true
  },
  {
    title: "Smart Home Automation",
    description: "Building IoT-based smart home systems and automation solutions.",
    category: "IoT",
    duration: 25,
    level: "Beginner",
    price: 39.99,
    isPublished: true
  },
  
  // Embedded Systems Courses
  {
    title: "Microcontroller Programming",
    description: "Learn programming and interfacing with popular microcontrollers.",
    category: "Embedded Systems",
    duration: 40,
    level: "Beginner",
    price: 54.99,
    isPublished: true
  },
  {
    title: "Real-Time Operating Systems",
    description: "Understanding RTOS concepts and applications in embedded systems.",
    category: "Embedded Systems",
    duration: 35,
    level: "Intermediate",
    price: 64.99,
    isPublished: true
  },
  {
    title: "Embedded System Design",
    description: "Complete embedded system design workflow from specifications to implementation.",
    category: "Embedded Systems",
    duration: 50,
    level: "Advanced",
    price: 79.99,
    isPublished: true
  },
  {
    title: "ARM Architecture Programming",
    description: "Programming ARM-based microcontrollers and processors.",
    category: "Embedded Systems",
    duration: 45,
    level: "Intermediate",
    price: 69.99,
    isPublished: true
  },
  
  // Skill Development Courses
  {
    title: "Effective Communication Skills",
    description: "Improve verbal, non-verbal and written communication in professional settings.",
    category: "Skill Development",
    duration: 20,
    level: "Beginner",
    price: 29.99,
    isPublished: true
  },
  {
    title: "Project Management Fundamentals",
    description: "Learn the basics of project management methodologies and tools.",
    category: "Skill Development",
    duration: 25,
    level: "Beginner",
    price: 39.99,
    isPublished: true
  },
  {
    title: "Leadership and Team Management",
    description: "Develop leadership skills to effectively manage and motivate teams.",
    category: "Skill Development",
    duration: 30,
    level: "Intermediate",
    price: 49.99,
    isPublished: true
  },
  
  // Robotics Courses
  {
    title: "Introduction to Robotics",
    description: "Fundamentals of robotics including mechanics, electronics, and control systems.",
    category: "Robotics",
    duration: 35,
    level: "Beginner",
    price: 59.99,
    isPublished: true
  },
  {
    title: "Robot Operating System (ROS)",
    description: "Learn to program robots using the Robot Operating System framework.",
    category: "Robotics",
    duration: 45,
    level: "Intermediate",
    price: 69.99,
    isPublished: true
  },
  {
    title: "Mobile Robot Navigation",
    description: "Algorithms and techniques for robot localization and navigation.",
    category: "Robotics",
    duration: 40,
    level: "Advanced",
    price: 79.99,
    isPublished: true
  },
  {
    title: "Computer Vision for Robotics",
    description: "Implementing computer vision algorithms for robot perception.",
    category: "Robotics",
    duration: 50,
    level: "Advanced",
    price: 84.99,
    isPublished: true
  },
  {
    title: "Industrial Robotics",
    description: "Programming and controlling industrial robotic arms and systems.",
    category: "Robotics",
    duration: 45,
    level: "Intermediate",
    price: 74.99,
    isPublished: true
  }
];

// Function to seed courses
async function addCourses() {
  try {
    // Insert courses
    const result = await Course.insertMany(courses);
    console.log(`Successfully added ${result.length} courses to the database`);
  } catch (error) {
    console.error('Error adding courses:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
addCourses();
