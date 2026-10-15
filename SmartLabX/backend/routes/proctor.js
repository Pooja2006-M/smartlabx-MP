const express = require('express');
const router = express.Router();

const PYTHON_PROCTOR_SERVICE_URL = process.env.PYTHON_PROCTOR_SERVICE_URL || 'http://localhost:8000';

// Check Python proctor service health
router.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_PROCTOR_SERVICE_URL}/health`);
    const data = await response.json();
    return res.json({ connected: true, service: data });
  } catch (err) {
    return res.json({ connected: false, error: 'Python InvigiLMNce service is offline', url: PYTHON_PROCTOR_SERVICE_URL });
  }
});

// Check Student Enrollment Status
router.get('/enrollment-status/:studentId', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_PROCTOR_SERVICE_URL}/api/enroll/status/${req.params.studentId}`);
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to communicate with proctoring engine', details: err.message });
  }
});

// Forward Face Enrollment
router.post('/enroll', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_PROCTOR_SERVICE_URL}/api/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Enrollment service request failed', details: err.message });
  }
});

// Proxy single frame proctoring check (HTTP fallback)
router.post('/process-frame', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_PROCTOR_SERVICE_URL}/api/proctor/frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proctoring frame evaluation failed', details: err.message });
  }
});

// Request PDF Report Generation
router.post('/generate-report', async (req, res) => {
  try {
    const formData = new URLSearchParams();
    formData.append('student_id', req.body.student_id);

    const response = await fetch(`${PYTHON_PROCTOR_SERVICE_URL}/api/report/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Report generation failed', details: err.message });
  }
});

// ─── LLM-Powered AI Analysis Routes ─────────────────────────────────────────

// Full frame analysis: Face Detection + Emotion + LLM Suggestion (all-in-one)
router.post('/analyze-frame', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_PROCTOR_SERVICE_URL}/api/analyze/frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'AI analysis service unavailable', details: err.message });
  }
});

// Direct LLM suggestion from pre-computed analysis data
router.post('/llm-suggest', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_PROCTOR_SERVICE_URL}/api/llm/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'LLM suggestion service unavailable', details: err.message });
  }
});

module.exports = router;
