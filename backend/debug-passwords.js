// debug-passwords.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const debugPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users with their passwords
    const users = await User.find({}).select('email password employeeId');
    
    console.log('\n🔍 Current users in database:');
    console.log('================================');
    
    // Test common passwords against each user
    const testPasswords = ['admin123', 'password123', 'admin', 'password', 'eskilz123'];
    
    for (const user of users) {
      console.log(`\n👤 ${user.employeeId} - ${user.email}`);
      console.log(`   Password hash: ${user.password.substring(0, 30)}...`);
      
      let foundMatch = false;
      for (const testPassword of testPasswords) {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        if (isMatch) {
          console.log(`   ✅ PASSWORD FOUND: "${testPassword}"`);
          foundMatch = true;
          break;
        }
      }
      
      if (!foundMatch) {
        console.log(`   ❌ No match found for common passwords`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error debugging passwords:', error);
    process.exit(1);
  }
};

debugPasswords();