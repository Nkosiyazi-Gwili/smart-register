require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const Department = require('./models/Department');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Company.deleteMany({});
    await Department.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create company
    const company = await Company.create({
      name: 'Tech Solutions Inc',
      email: 'admin@techsolutions.com',
      phone: '+1 (555) 123-4567',
      website: 'https://techsolutions.com',
      locations: [{
        name: 'Main Office',
        address: '123 Business District, Tech City, TC 12345',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        radius: 150
      }],
      settings: {
        shiftStart: "09:00",
        shiftEnd: "17:00",
        gracePeriod: 15,
        autoApproveLeave: false
      }
    });

    console.log('🏢 Company created');

    // Create departments
    const hrDept = await Department.create({
      name: 'Human Resources',
      company: company._id,
      description: 'Handles recruitment, employee relations, and HR operations'
    });

    const itDept = await Department.create({
      name: 'IT Department',
      company: company._id,
      description: 'Manages technology infrastructure and software development'
    });

    const salesDept = await Department.create({
      name: 'Sales',
      company: company._id,
      description: 'Responsible for business development and client acquisition'
    });

    const financeDept = await Department.create({
      name: 'Finance',
      company: company._id,
      description: 'Manages company finances and accounting'
    });

    console.log('📊 Departments created');

    // Create admin user
    const admin = await User.create({
      employeeId: 'ADM001',
      email: 'admin@company.com',
      password: 'password123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      company: company._id,
      department: hrDept._id,
      position: 'System Administrator',
      phone: '+1 (555) 111-0001',
      leaveBalance: {
        sick: 15,
        vacation: 30,
        personal: 10
      }
    });

    // Create manager users
    const hrManager = await User.create({
      employeeId: 'MGR001',
      email: 'hr.manager@company.com',
      password: 'password123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'manager',
      company: company._id,
      department: hrDept._id,
      position: 'HR Manager',
      phone: '+1 (555) 111-0002',
      leaveBalance: {
        sick: 15,
        vacation: 25,
        personal: 8
      }
    });

    const itManager = await User.create({
      employeeId: 'MGR002',
      email: 'it.manager@company.com',
      password: 'password123',
      firstName: 'Michael',
      lastName: 'Chen',
      role: 'manager',
      company: company._id,
      department: itDept._id,
      position: 'IT Manager',
      phone: '+1 (555) 111-0003',
      leaveBalance: {
        sick: 15,
        vacation: 25,
        personal: 8
      }
    });

    // Set department managers
    hrDept.manager = hrManager._id;
    itDept.manager = itManager._id;
    await hrDept.save();
    await itDept.save();

    // Create employee users
    const employee1 = await User.create({
      employeeId: 'EMP001',
      email: 'employee@company.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'employee',
      company: company._id,
      department: itDept._id,
      position: 'Software Developer',
      phone: '+1 (555) 111-0004',
      leaveBalance: {
        sick: 12,
        vacation: 21,
        personal: 5
      }
    });

    const employee2 = await User.create({
      employeeId: 'EMP002',
      email: 'jane.smith@company.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'employee',
      company: company._id,
      department: salesDept._id,
      position: 'Sales Executive',
      phone: '+1 (555) 111-0005',
      leaveBalance: {
        sick: 12,
        vacation: 21,
        personal: 5
      }
    });

    const employee3 = await User.create({
      employeeId: 'EMP003',
      email: 'robert.wilson@company.com',
      password: 'password123',
      firstName: 'Robert',
      lastName: 'Wilson',
      role: 'employee',
      company: company._id,
      department: financeDept._id,
      position: 'Financial Analyst',
      phone: '+1 (555) 111-0006',
      leaveBalance: {
        sick: 12,
        vacation: 21,
        personal: 5
      }
    });

    console.log('👥 Users created');

    console.log('\n✅ Sample data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('=====================');
    console.log('Admin:');
    console.log('  Email: admin@company.com');
    console.log('  Password: password123');
    console.log('\nManagers:');
    console.log('  HR Manager: hr.manager@company.com / password123');
    console.log('  IT Manager: it.manager@company.com / password123');
    console.log('\nEmployees:');
    console.log('  Employee 1: employee@company.com / password123');
    console.log('  Employee 2: jane.smith@company.com / password123');
    console.log('  Employee 3: robert.wilson@company.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();