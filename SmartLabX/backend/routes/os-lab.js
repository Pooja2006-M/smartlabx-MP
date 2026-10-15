const express = require('express');
const router = express.Router();
const OSExperiment = require('../models/OSExperiment');

// Mock Auth Middleware for Demo Purposes (in a real app, use auth middleware)
const authenticate = (req, res, next) => {
  // Hardcoded for demo if not using real JWT
  req.user = { id: 'dummy_student_id', role: 'student' };
  next();
};

// 1. Get student progress for all OS experiments
router.get('/progress', authenticate, async (req, res) => {
  try {
    const experiments = await OSExperiment.find({ student: req.user.id });
    res.json(experiments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Start or resume an experiment
router.post('/start', authenticate, async (req, res) => {
  try {
    const { experimentId } = req.body;
    let exp = await OSExperiment.findOne({ student: req.user.id, experimentId });
    
    if (!exp) {
       exp = new OSExperiment({
          student: req.user.id,
          experimentId,
          status: 'Started'
       });
       await exp.save();
    }
    res.json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update experiment progress (Auto-save)
router.put('/progress/:id', authenticate, async (req, res) => {
  try {
    const { progress, timeSpentSeconds, action, aiHintsUsed } = req.body;
    const exp = await OSExperiment.findById(req.params.id);
    
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });
    
    if (progress !== undefined) exp.progress = progress;
    if (timeSpentSeconds !== undefined) exp.timeSpentSeconds = timeSpentSeconds;
    if (aiHintsUsed !== undefined) exp.aiHintsUsed = aiHintsUsed;
    if (action) {
       exp.actionTimeline.push({ timestamp: new Date(), action });
    }
    exp.lastUpdatedAt = Date.now();
    if (progress === 100 && exp.status !== 'Submitted' && exp.status !== 'Graded') {
       exp.status = 'InProgress'; // Or ready for submission
    }
    
    await exp.save();
    res.json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Submit experiment report and viva
router.post('/submit/:id', authenticate, async (req, res) => {
  try {
    const { reportFileUrl, vivaResponses } = req.body;
    const exp = await OSExperiment.findById(req.params.id);
    
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });
    
    exp.status = 'Submitted';
    if (reportFileUrl) exp.reportFileUrl = reportFileUrl;
    if (vivaResponses) exp.vivaResponses = vivaResponses;
    
    await exp.save();
    res.json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. [Faculty] Get all submissions
router.get('/faculty/submissions', async (req, res) => {
  try {
    // Note: Add faculty role check here in production
    const submissions = await OSExperiment.find({ status: { $in: ['Submitted', 'Graded'] } }).populate('student', 'name email');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. [Faculty] Grade submission
router.post('/faculty/grade/:id', async (req, res) => {
  try {
    const { score, facultyFeedback } = req.body;
    const exp = await OSExperiment.findById(req.params.id);
    
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });
    
    exp.status = 'Graded';
    exp.score = score;
    exp.facultyFeedback = facultyFeedback;
    
    await exp.save();
    res.json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
