const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('[WS] Client connected to Live Tracking Socket:', socket.id);

  socket.on('student-activity', (data) => {
    io.emit('live-student-activity', data);
  });

  socket.on('proctor-telemetry', (data) => {
    io.emit('proctor-telemetry-broadcast', data);
  });

  socket.on('proctor-alert', (data) => {
    io.emit('proctor-alert-broadcast', data);
  });

  socket.on('security-event', (data) => {
    io.emit('security-event', data);
  });

  socket.on('ai-question', (data) => {
    io.emit('ai-question', data);
  });

  socket.on('send-warning', (data) => {
    io.emit('receive-staff-warning', data);
  });

  socket.on('workspace-lock', (data) => {
    io.emit('workspace-lock', data);
  });

  socket.on('class-announcement', (data) => {
    io.emit('class-announcement', data);
  });

  socket.on('raise-support-notify', (data) => {
    io.emit('raise-support-notify', data);
  });

  socket.on('raise-evidence', (data) => {
    io.emit('raise-evidence', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/lab', require('./routes/lab'));
app.use('/api/dbms', require('./routes/dbms'));
app.use('/api/os-lab', require('./routes/os-lab'));
app.use('/api/home', require('./routes/home'));
app.use('/api/proctor', require('./routes/proctor'));
app.use('/api/raise', require('./routes/raise'));

// Basic Health Check Route
app.get('/', (req, res) => {
  res.send('SmartLabX Backend with Live Tracking is running!');
});

// Seed Initial Users
const seedUsers = async () => {
  try {
    const demoUsers = [
      { name: 'System Administrator', email: 'admin@smartlabx.edu', password: 'admin123', role: 'admin' },
      { name: 'Dr. Alan Turing', email: 'faculty@smartlabx.edu', password: 'faculty123', role: 'faculty' },
      { name: 'Aarav Kumar', email: 'student@smartlabx.edu', password: 'password123', role: 'student', batch: 'Batch 43' },
      { name: 'Priya Sharma', email: 'priya@smartlabx.edu', password: 'password123', role: 'student', batch: 'Batch 43' },
    ];

    for (const userData of demoUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({
          ...userData,
          password: hashedPassword,
        });
        console.log(`${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} user seeded: ${userData.email}`);
      }
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

// Database Connection
const startApp = () => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

const raiseStore = require('./services/raiseStore');

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Successfully connected to MongoDB');
      await seedUsers();
      await raiseStore.init();
      startApp();
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
    });
} else {
  console.warn('No MONGODB_URI provided — starting server without DB (DB-backed features will be limited).');
  raiseStore.init().then(() => startApp());
}

