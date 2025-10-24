// reset-passwords.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const resetPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Reset admin password
    const adminHash = await bcrypt.hash('admin123', 12);
    await User.findOneAndUpdate(
      { email: 'admin@eskilzcollege.co.za' },
      { password: adminHash }
    );
    console.log('✅ Admin password reset to: admin123');

    // Reset all other users to 'password123'
    const userHash = await bcrypt.hash('password123', 12);
    await User.updateMany(
      { email: { $ne: 'admin@eskilzcollege.co.za' } },
      { password: userHash }
    );
    
    console.log('✅ All other user passwords reset to: password123');
    
    // Verify the changes
    const users = await User.find({}).select('email password');
    console.log('\n📋 Updated users:');
    users.forEach(user => {
      console.log(`   ${user.email}: ${user.password.substring(0, 20)}...`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
    process.exit(1);
  }
};

resetPasswords();