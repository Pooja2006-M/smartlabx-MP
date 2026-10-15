const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new user
// @route   POST /api/admin/users
exports.createUser = async (req, res) => {
  const { name, email, password, role, dept, batch, section } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10); // default password if not provided

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      dept,
      batch,
      section,
      status: 'Active'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept,
      batch: user.batch,
      section: user.section,
      status: user.status
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
