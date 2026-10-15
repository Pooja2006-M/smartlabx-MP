const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const demoUsers = [
    { name: 'System Administrator', email: 'admin@smartlabx.edu', password: 'admin123', role: 'admin' },
    { name: 'Dr. Alan Turing', email: 'faculty@smartlabx.edu', password: 'faculty123', role: 'faculty' },
    { name: 'Aarav Kumar', email: 'student@smartlabx.edu', password: 'password123', role: 'student', studentId: 'STU-2048', batch: 'Batch 43' },
    { name: 'Priya Sharma', email: 'priya@smartlabx.edu', password: 'password123', role: 'student', studentId: 'STU-2049', batch: 'Batch 43' },
  ];

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const providedPassword = String(password || '');
  const demoUser = demoUsers.find((user) => {
    if (user.email !== normalizedEmail) return false;
    return user.password === providedPassword || (user.email.startsWith('student') && providedPassword === 'student123');
  });

  if (demoUser) {
    const token = jwt.sign(
      { id: demoUser.email, role: demoUser.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    return res.json({
      _id: demoUser.email,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      token,
      studentId: demoUser.studentId,
      batch: demoUser.batch,
    });
  }

  try {
    if (!process.env.MONGODB_URI) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
