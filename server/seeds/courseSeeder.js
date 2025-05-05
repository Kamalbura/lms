import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms')
  .then(() => logger.info('MongoDB connected for seeding'))
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Course data - 30 courses across different categories
const courses = [
  // CSE Courses
  {
    title: "Advanced Data Structures",
    slug: "advanced-data-structures",
    description: "Learn advanced data structures and algorithms for efficient problem solving.",
    category: "CSE",
    duration: 45,
    level: "Advanced",
    price: 59.99,
    isPublished: true
  },
  {
    title: "Web Development Bootcamp",
    slug: "web-development-bootcamp",
    description: "Comprehensive course on modern web development technologies including HTML, CSS, JavaScript, and frameworks.",
    category: "CSE",
    duration: 60,
    level: "Intermediate",
    price: 79.99,
    isPublished: true
  },
  {
    title: "Machine Learning Fundamentals",
    slug: "machine-learning-fundamentals",
    description: "Introduction to machine learning concepts, algorithms and practical applications.",
    category: "CSE",
    duration: 50,
    level: "Intermediate",
    price: 89.99,
    isPublished: true
  },
  {
    title: "Database Management Systems",
    slug: "database-management-systems",
    description: "Learn about database design, SQL, and database administration.",
    category: "CSE",
    duration: 40,
    level: "Beginner",
    price: 49.99,
    isPublished: true
  },
  {
    title: "Cloud Computing Architecture",
    slug: "cloud-computing-architecture",
    description: "Understanding cloud computing platforms, services, and deployment models.",
    category: "CSE",
    duration: 35,
    level: "Intermediate",
    price: 69.99,
    isPublished: true
  },
  {
    title: "Cybersecurity Essentials",
    slug: "cybersecurity-essentials",
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
    slug: "iot-fundamentals",
    description: "Introduction to Internet of Things concepts, architecture, and applications.",
    category: "IoT",
    duration: 30,
    level: "Beginner",
    price: 49.99,
    isPublished: true
  },
  {
    title: "IoT Sensor Networks",
    slug: "iot-sensor-networks",
    description: "Working with various sensors, sensor fusion, and wireless sensor networks for IoT.",
    category: "IoT",
    duration: 35,
    level: "Intermediate",
    price: 59.99,
    isPublished: true
  },
  {
    title: "IoT Security",
    slug: "iot-security",
    description: "Understanding security challenges and implementing secure IoT systems.",
    category: "IoT",
    duration: 40,
    level: "Advanced",
    price: 69.99,
    isPublished: true
  },
  {
    title: "IoT Protocol Stack",
    slug: "iot-protocol-stack",
    description: "Detailed study of communication protocols used in IoT systems.",
    category: "IoT",
    duration: 45,
    level: "Intermediate",
    price: 64.99,
    isPublished: true
  },
  {
    title: "Smart Home Automation",
    slug: "smart-home-automation",
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
    slug: "microcontroller-programming",
    description: "Learn programming and interfacing with popular microcontrollers.",
    category: "Embedded Systems",
    duration: 40,
    level: "Beginner",
    price: 54.99,
    isPublished: true
  },
  {
    title: "Real-Time Operating Systems",
    slug: "real-time-operating-systems",
    description: "Understanding RTOS concepts and applications in embedded systems.",
    category: "Embedded Systems",
    duration: 35,
    level: "Intermediate",
    price: 64.99,
    isPublished: true
  },
  {
    title: "Embedded System Design",
    slug: "embedded-system-design",
    description: "Complete embedded system design workflow from specifications to implementation.",
    category: "Embedded Systems",
    duration: 50,
    level: "Advanced",
    price: 79.99,
    isPublished: true
  },
  {
    title: "ARM Architecture Programming",
    slug: "arm-architecture-programming",
    description: "Programming ARM-based microcontrollers and processors.",
    category: "Embedded Systems",
    duration: 45,
    level: "Intermediate",
    price: 69.99,
    isPublished: true
  },
  {
    title: "Digital Signal Processing",
    slug: "digital-signal-processing",
    description: "DSP algorithms and implementation in embedded systems.",
    category: "Embedded Systems",
    duration: 40,
    level: "Advanced",
    price: 74.99,
    isPublished: true
  },
  {
    title: "Embedded Linux",
    slug: "embedded-linux",
    description: "Building Linux-based embedded systems and applications.",
    category: "Embedded Systems",
    duration: 55,
    level: "Advanced",
    price: 89.99,
    isPublished: true
  },
  
  // Skill Development Courses
  {
    title: "Effective Communication Skills",
    slug: "effective-communication-skills",
    description: "Improve verbal, non-verbal and written communication in professional settings.",
    category: "Skill Development",
    duration: 20,
    level: "Beginner",
    price: 29.99,
    isPublished: true
  },
  {
    title: "Project Management Fundamentals",
    slug: "project-management-fundamentals",
    description: "Learn the basics of project management methodologies and tools.",
    category: "Skill Development",
    duration: 25,
    level: "Beginner",
    price: 39.99,
    isPublished: true
  },
  {
    title: "Leadership and Team Management",
    slug: "leadership-and-team-management",
    description: "Develop leadership skills to effectively manage and motivate teams.",
    category: "Skill Development",
    duration: 30,
    level: "Intermediate",
    price: 49.99,
    isPublished: true
  },
  {
    title: "Time Management Mastery",
    slug: "time-management-mastery",
    description: "Techniques and strategies for effective time management and productivity.",
    category: "Skill Development",
    duration: 15,
    level: "Beginner",
    price: 24.99,
    isPublished: true
  },
  {
    title: "Critical Thinking and Problem Solving",
    slug: "critical-thinking-and-problem-solving",
    description: "Enhance analytical thinking and problem-solving abilities.",
    category: "Skill Development",
    duration: 20,
    level: "Intermediate",
    price: 34.99,
    isPublished: true
  },
  
  // Robotics Courses
  {
    title: "Introduction to Robotics",
    slug: "introduction-to-robotics",
    description: "Fundamentals of robotics including mechanics, electronics, and control systems.",
    category: "Robotics",
    duration: 35,
    level: "Beginner",
    price: 59.99,
    isPublished: true
  },
  {
    title: "Robot Operating System (ROS)",
    slug: "robot-operating-system-ros",
    description: "Learn to program robots using the Robot Operating System framework.",
    category: "Robotics",
    duration: 45,
    level: "Intermediate",
    price: 69.99,
    isPublished: true
  },
  {
    title: "Mobile Robot Navigation",
    slug: "mobile-robot-navigation",
    description: "Algorithms and techniques for robot localization and navigation.",
    category: "Robotics",
    duration: 40,
    level: "Advanced",
    price: 79.99,
    isPublished: true
  },
  {
    title: "Computer Vision for Robotics",
    slug: "computer-vision-for-robotics",
    description: "Implementing computer vision algorithms for robot perception.",
    category: "Robotics",
    duration: 50,
    level: "Advanced",
    price: 84.99,
    isPublished: true
  },
  {
    title: "Industrial Robotics",
    slug: "industrial-robotics",
    description: "Programming and controlling industrial robotic arms and systems.",
    category: "Robotics",
    duration: 45,
    level: "Intermediate",
    price: 74.99,
    isPublished: true
  },
  {
    title: "Drone Programming and Control",
    slug: "drone-programming-and-control",
    description: "Learn to program and control autonomous drones and UAVs.",
    category: "Robotics",
    duration: 35,
    level: "Intermediate",
    price: 69.99,
    isPublished: true
  }
];

// Seed the courses
const seedCourses = async () => {
  try {
    // Clear existing courses
    await Course.deleteMany({});
    logger.info('Previous courses deleted');
    
    // Insert new courses
    const createdCourses = await Course.insertMany(courses);
    logger.info(`${createdCourses.length} courses seeded successfully`);
    
    // Disconnect from MongoDB
    mongoose.disconnect();
    logger.info('MongoDB disconnected after seeding');
  } catch (error) {
    logger.error('Error seeding courses:', error);
    process.exit(1);
  }
};

// Execute seeding
seedCourses();
