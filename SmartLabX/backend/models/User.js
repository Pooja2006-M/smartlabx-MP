const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'faculty', 'student'],
    default: 'student',
  },
  dept: {
    type: String,
  },
  batch: {
    type: String,
  },
  section: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
