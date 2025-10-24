require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const Department = require('./models/Department');

const seedData = async () => {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is required');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    console.log(`📡 Database: ${process.env.MONGODB_URI.includes('localhost') ? 'Local' : 'Production'}`);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - you might want to skip this in production)
    const shouldClearData = process.argv.includes('--clear') || process.env.NODE_ENV !== 'production';
    
    if (shouldClearData) {
      console.log('🗑️  Clearing existing data...');
      await User.deleteMany({});
      await Company.deleteMany({});
      await Department.deleteMany({});
      console.log('✅ Existing data cleared');
    } else {
      console.log('ℹ️  Skipping data clearance (use --clear flag to force clear)');
    }

    // Check if company already exists
    let company = await Company.findOne({ name: 'Eskilz Private FET College' });
    
    if (company) {
      console.log('🏢 Company already exists, updating...');
    } else {
      console.log('🏢 Creating company...');
      
      // Create company
      company = await Company.create({
        name: 'Eskilz Private FET College',
        address: '267 Market Street, Witkoppen Rd, Noordhang, Randburg, 2188',
        latitude: -26.038123,
        longitude: 27.968089,
        radius: 50,
        contactEmail: 'admin@eskilzcollege.co.za',
        contactPhone: '+27 10 030 0080',
        workingHours: {
          start: "08:00",
          end: "16:30"
        },
        settings: {
          requireSelfie: true,
          requireLocation: true,
          autoApproveAttendance: false
        }
      });

      console.log('✅ Company created');
    }

    // Create or update departments
    console.log('📊 Setting up departments...');
    
    const departmentsData = [
      {
        name: 'Human Resources',
        description: 'Handles recruitment, employee relations, and HR operations'
      },
      {
        name: 'IT Department', 
        description: 'Manages technology infrastructure and software development'
      },
      {
        name: 'Sales',
        description: 'Responsible for business development and client acquisition'
      },
      {
        name: 'Finance',
        description: 'Manages company finances and accounting'
      },
      {
        name: 'Academic',
        description: 'Teaching and academic operations'
      },
      {
        name: 'Administration',
        description: 'General administration and support services'
      }
    ];

    const departments = {};
    
    for (const deptData of departmentsData) {
      let department = await Department.findOne({ 
        name: deptData.name,
        company: company._id 
      });
      
      if (!department) {
        department = await Department.create({
          ...deptData,
          company: company._id
        });
        console.log(`✅ Created department: ${deptData.name}`);
      } else {
        console.log(`ℹ️  Department already exists: ${deptData.name}`);
      }
      
      departments[deptData.name.replace(/\s+/g, '').toLowerCase()] = department;
    }

    // Create or update users
    console.log('👥 Setting up users...');

    const usersData = [
      // Admin user
      {
        employeeId: 'ADM001',
        email: 'admin@eskilzcollege.co.za',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        department: departments.humanresources._id,
        position: 'System Administrator',
        phone: '+27 10 030 0080',
        leaveBalance: { sick: 15, vacation: 30, personal: 10 }
      },
      // HR Manager
      {
        employeeId: 'MGR001',
        email: 'hr@eskilzcollege.co.za',
        password: 'password123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'manager',
        department: departments.humanresources._id,
        position: 'HR Manager',
        phone: '+27 11 222 3333',
        leaveBalance: { sick: 15, vacation: 25, personal: 8 }
      },
      // IT Manager
      {
        employeeId: 'MGR002',
        email: 'it@eskilzcollege.co.za',
        password: 'password123',
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'manager',
        department: departments.itdepartment._id,
        position: 'IT Manager',
        phone: '+27 11 222 3334',
        leaveBalance: { sick: 15, vacation: 25, personal: 8 }
      },
      // Academic Manager
      {
        employeeId: 'MGR003',
        email: 'academic@eskilzcollege.co.za',
        password: 'password123',
        firstName: 'David',
        lastName: 'Wilson',
        role: 'manager',
        department: departments.academic._id,
        position: 'Academic Manager',
        phone: '+27 11 222 3335',
        leaveBalance: { sick: 15, vacation: 25, personal: 8 }
      },
      // Employee users
      {
        employeeId: 'EMP001',
        email: 'john.doe@eskilzcollege.co.za',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee',
        department: departments.itdepartment._id,
        position: 'Software Developer',
        phone: '+27 11 222 3336',
        leaveBalance: { sick: 12, vacation: 21, personal: 5 }
      },
      {
        employeeId: 'EMP002',
        email: 'jane.smith@eskilzcollege.co.za',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'employee',
        department: departments.sales._id,
        position: 'Sales Executive',
        phone: '+27 11 222 3337',
        leaveBalance: { sick: 12, vacation: 21, personal: 5 }
      },
      {
        employeeId: 'EMP003',
        email: 'robert.wilson@eskilzcollege.co.za',
        password: 'password123',
        firstName: 'Robert',
        lastName: 'Wilson',
        role: 'employee',
        department: departments.finance._id,
        position: 'Financial Analyst',
        phone: '+27 11 222 3338',
        leaveBalance: { sick: 12, vacation: 21, personal: 5 }
      },
      {
        employeeId: 'EMP004',
        email: 'linda.brown@eskilzcollege.co.za',
        password: 'password123',
        firstName: 'Linda',
        lastName: 'Brown',
        role: 'employee',
        department: departments.academic._id,
        position: 'Lecturer',
        phone: '+27 11 222 3339',
        leaveBalance: { sick: 12, vacation: 21, personal: 5 }
      },
      {
        employeeId: 'EMP005',
        email: 'james.miller@eskilzcollege.co.za',
        password: 'password123',
        firstName: 'James',
        lastName: 'Miller',
        role: 'employee',
        department: departments.administration._id,
        position: 'Administrative Assistant',
        phone: '+27 11 222 3340',
        leaveBalance: { sick: 12, vacation: 21, personal: 5 }
      }
    ];

    for (const userData of usersData) {
      let user = await User.findOne({ 
        email: userData.email,
        company: company._id 
      });

      if (user) {
        // Update existing user
        user.firstName = userData.firstName;
        user.lastName = userData.lastName;
        user.role = userData.role;
        user.department = userData.department;
        user.position = userData.position;
        user.phone = userData.phone;
        user.leaveBalance = userData.leaveBalance;
        
        // Only update password if provided and different
        if (userData.password && !user.comparePassword(userData.password)) {
          user.password = userData.password;
        }
        
        await user.save();
        console.log(`✅ Updated user: ${userData.email}`);
      } else {
        // Create new user
        user = await User.create({
          ...userData,
          company: company._id
        });
        console.log(`✅ Created user: ${userData.email}`);
      }
    }

    // Update department managers
    console.log('👨‍💼 Assigning department managers...');
    
    const hrManager = await User.findOne({ email: 'hr@eskilzcollege.co.za' });
    const itManager = await User.findOne({ email: 'it@eskilzcollege.co.za' });
    const academicManager = await User.findOne({ email: 'academic@eskilzcollege.co.za' });
    
    if (hrManager) {
      departments.humanresources.manager = hrManager._id;
      await departments.humanresources.save();
    }
    
    if (itManager) {
      departments.itdepartment.manager = itManager._id;
      await departments.itdepartment.save();
    }
    
    if (academicManager) {
      departments.academic.manager = academicManager._id;
      await departments.academic.save();
    }

    console.log('✅ Department managers assigned');

    // Update employee counts
    console.log('📊 Updating employee counts...');
    
    for (const department of Object.values(departments)) {
      await department.updateEmployeeCount();
    }

    console.log('✅ Employee counts updated');

    console.log('\n🎉 Sample data setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('=====================');
    console.log('Admin:');
    console.log('  Email: admin@eskilzcollege.co.za');
    console.log('  Password: admin123');
    console.log('\nManagers:');
    console.log('  HR Manager: hr@eskilzcollege.co.za / password123');
    console.log('  IT Manager: it@eskilzcollege.co.za / password123');
    console.log('  Academic Manager: academic@eskilzcollege.co.za / password123');
    console.log('\nEmployees:');
    console.log('  John Doe: john.doe@eskilzcollege.co.za / password123');
    console.log('  Jane Smith: jane.smith@eskilzcollege.co.za / password123');
    console.log('  Robert Wilson: robert.wilson@eskilzcollege.co.za / password123');
    console.log('  Linda Brown: linda.brown@eskilzcollege.co.za / password123');
    console.log('  James Miller: james.miller@eskilzcollege.co.za / password123');

    console.log('\n📍 Company Location:');
    console.log('  Address: 267 Market Street, Witkoppen Rd, Noordhang, Randburg, 2188');
    console.log('  Coordinates: -26.038123, 27.968089');
    console.log('  Check-in Radius: 50 meters');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Script terminated by user');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Script terminated');
  await mongoose.connection.close();
  process.exit(0);
});

seedData();