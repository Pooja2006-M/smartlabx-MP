const mongoose = require('mongoose');

const OSExperimentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  experimentId: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['Started', 'InProgress', 'Submitted', 'Graded'],
    default: 'Started'
  },
  progress: {
    type: Number,
    default: 0
  },
  timeSpentSeconds: {
    type: Number,
    default: 0
  },
  aiHintsUsed: {
    type: Number,
    default: 0
  },
  reportFileUrl: {
    type: String
  },
  vivaResponses: [{
    question: String,
    answer: String
  }],
  score: {
    type: Number
  },
  facultyFeedback: {
    type: String
  },
  actionTimeline: [{
    timestamp: Date,
    action: String
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('OSExperiment', OSExperimentSchema);
