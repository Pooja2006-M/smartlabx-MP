require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing students and faculty to avoid duplicates
    await User.deleteMany({ role: { $in: ['student', 'faculty'] } });
    console.log('Cleared existing students and faculty');

    // Create 4 Staff
    const staffList = [];
    for (let i = 1; i <= 4; i++) {
      staffList.push({
        name: `Faculty ${i}`,
        email: `faculty${i}@smartlabx.edu`,
        password: 'password123',
        role: 'faculty',
        dept: 'Computer Science Engineering',
        status: 'Active'
      });
    }
    await User.insertMany(staffList);
    console.log('Created 4 Faculty members');

    // Create 120 Students
    const studentList = [];
    for (let i = 1; i <= 120; i++) {
      let batchName = 'Batch A';
      if (i > 40 && i <= 80) batchName = 'Batch B';
      if (i > 80) batchName = 'Batch C';

      studentList.push({
        name: `Student ${i}`,
        email: `roll${i}@smartlabx.edu`,
        password: 'password123',
        role: 'student',
        dept: 'Computer Science Engineering',
        batch: batchName,
        section: 'A',
        status: 'Active'
      });
    }
    await User.insertMany(studentList);
    console.log('Created 120 Students (Roll 1 to 120)');

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
