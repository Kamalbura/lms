// Simple script to create initial users in MongoDB Atlas
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB Atlas connection string
const MONGO_URI = 'mongodb+srv://kamal:kamal123@lms.r7f5ghe.mongodb.net/?retryWrites=true&w=majority&appName=lms';

// User schema - simplified version matching your model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  profileImage: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
async function setupDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@prolearn.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'Admin User',
        email: 'admin@prolearn.com',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    // Create instructor user
    const instructorExists = await User.findOne({ email: 'instructor@prolearn.com' });
    if (!instructorExists) {
      const instructor = new User({
        name: 'John Instructor',
        email: 'instructor@prolearn.com',
        password: 'instructor123',
        role: 'instructor'
      });
      await instructor.save();
      console.log('Instructor user created successfully');
    } else {
      console.log('Instructor user already exists');
    }
    
    // Create student user
    const studentExists = await User.findOne({ email: 'student@prolearn.com' });
    if (!studentExists) {
      const student = new User({
        name: 'Jane Student',
        email: 'student@prolearn.com',
        password: 'student123',
        role: 'student'
      });
      await student.save();
      console.log('Student user created successfully');
    } else {
      console.log('Student user already exists');
    }
    
    console.log('Database setup completed successfully');
    console.log('User credentials:');
    console.log('- Admin: admin@prolearn.com / admin123');
    console.log('- Instructor: instructor@prolearn.com / instructor123');
    console.log('- Student: student@prolearn.com / student123');
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setupDatabase();