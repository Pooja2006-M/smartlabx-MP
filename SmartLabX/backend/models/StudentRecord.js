const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: String,
  due: String,
  status: { type: String, default: 'Assigned' },
  createdAt: { type: Date, default: Date.now },
});

const ReportSchema = new mongoose.Schema({
  filename: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const StudentRecordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  assignedTasks: [TaskSchema],
  vivaNotes: { type: String, default: '' },
  reports: [ReportSchema],
}, { timestamps: true });

module.exports = mongoose.model('StudentRecord', StudentRecordSchema);
