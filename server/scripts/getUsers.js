import mongoose from 'mongoose';
import User from '../models/User.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB Connected');
  try {
    // Find all users
    const users = await User.find({}).select('-password');
    
    console.log('\n===== USERS IN DATABASE =====');
    
    if (users.length === 0) {
      console.log('No users found in the database');
    } else {
      users.forEach(user => {
        console.log(`\nID: ${user._id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Profile Image: ${user.profileImage || 'None'}`);
        console.log(`Created: ${user.createdAt}`);
        console.log('------------------------');
      });
      
      console.log(`\nTotal users: ${users.length}`);
    }
  } catch (error) {
    console.error('Error retrieving users:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('MongoDB Connection Closed');
  }
})
.catch(err => {
  console.error('MongoDB Connection Error:', err);
});