const express = require('express');
const router = express.Router();
const raise = require('../services/raiseEngine');
const store = require('../services/raiseStore');

// ── S1–S9 Scenario Suite ─────────────────────────────────────────────────
// Stateful, reactive simulation: friction depends on prior RAISE actions so
// decisions are exercised realistically per scenario.
const SCENARIOS = [
  { id: 'S1', description: 'Productive struggle — low friction, no intervention needed', type: 'smooth' },
  { id: 'S2', description: 'Moderate friction, one hint yields recovery (min-sufficient L1)', type: 'hint-recover' },
  { id: 'S3', description: 'Stuck learner — high friction, no momentum, SUPPORT_NOTIFY fires', type: 'stuck-support', steps: 12 },
  { id: 'S4', description: 'Critical friction (>80) escalates to faculty', type: 'critical' },
  { id: 'S5', description: 'Dependency loop — repeated hints without progress raises HDI', type: 'dependency' },
  { id: 'S6', description: 'Independent recovery after a hint lowers dependency (verified progress)', type: 'independent-recover' },
  { id: 'S7', description: 'Zero signals — trivial friction stays below activation', type: 'idle' },
  { id: 'S8', description: 'Cooldown respected — no double intervention in quick succession', type: 'cooldown' },
  { id: 'S9', description: 'Integrity risk adjusted when HDI high + corroborating progress absent', type: 'integrity' },
];

function simulateStep(scenario, idx, prior) {
  const s = scenario.type;
  const frictionAfterRecovery = (base) => Math.max(12, Math.round(base * 0.25));
  switch (s) {
    case 'smooth':
      return { rawFriction: 15 + (idx % 3), success: true, progress: 20 + idx * 15, hintRequests: 0 };
    case 'hint-recover': {
      // Fails first (friction climbs), then recovers hard once a hint is granted.
      const recovered = prior && prior.action === 'DELIVER_INTERVENTION';
      if (recovered) {
        return { rawFriction: frictionAfterRecovery(52), success: true, progress: 65, hintRequests: 0 };
      }
      return { rawFriction: 40 + idx * 5, success: false, progress: 20 + idx * 10, hintRequests: 1 };
    }
    case 'stuck-support':
      // Persistent high friction, zero success, zero momentum -> stuck.
      // Constant friction lets the EMA momentum decay to ~0 so stagnation is detected.
      return { rawFriction: 48, success: false, progress: 8, hintRequests: 0 };
    case 'critical':
      return { rawFriction: 82 + (idx % 5), success: false, progress: 5, hintRequests: 0 };
    case 'dependency':
      // Keeps requesting hints but rarely reaches success on its own.
      return { rawFriction: 50 + (idx % 6), success: idx === 7, progress: idx === 7 ? 55 : 10, hintRequests: idx === 7 ? 1 : 1 };
    case 'independent-recover': {
      // Hint-mediated recovery early; later succeeds on its own, lowering HDI.
      const recovered = prior && prior.action === 'DELIVER_INTERVENTION';
      if (recovered && idx < 4) {
        return { rawFriction: frictionAfterRecovery(46), success: true, progress: 50, hintRequests: 1 };
      }
      if (idx >= 4) {
        return { rawFriction: 18 + (idx % 3), success: true, progress: 55 + idx * 8, hintRequests: 0 };
      }
      return { rawFriction: 20 + idx * 12, success: false, progress: 20 + idx * 5, hintRequests: 1 };
    }
    case 'idle':
      return { rawFriction: 5 + (idx % 2), success: true, progress: 5 + idx * 3, hintRequests: 0 };
    case 'cooldown':
      // One intervention candidate, then an immediate re-trigger: cooldown should suppress it.
      return { rawFriction: idx <= 5 ? 60 : 20, success: idx <= 5 ? false : true, progress: idx <= 5 ? 20 : 40 + idx * 10, hintRequests: 0 };
    case 'integrity':
      // Low corroborating progress + high hint use -> integrity penalty.
      return { rawFriction: 45 + (idx % 5), success: idx % 3 === 0, progress: 15 + (idx % 3 === 0 ? 20 : 2), hintRequests: 1, baseIntegrityRisk: 20 };
    default:
      return {};
  }
}

function assertScenario(type, actions, meta, integrity, messages) {
  const has = (a) => actions.includes(a);
  switch (type) {
    case 'smooth':
      return { pass: !has('DELIVER_INTERVENTION') && !has('FACULTY_ALERT') && !has('SUPPORT_NOTIFY'), actual: `actions=${actions.join(',')}` };
    case 'hint-recover':
      return { pass: has('DELIVER_INTERVENTION') && actions[actions.length - 1] === 'WAIT', actual: `actions=${actions.join(',')}` };
    case 'stuck-support':
      return { pass: has('SUPPORT_NOTIFY'), actual: `actions=${actions.join(',')} | ${messages.join(' ')}` };
    case 'critical':
      return { pass: has('FACULTY_ALERT'), actual: `actions=${actions.join(',')}` };
    case 'dependency':
      return { pass: meta.HDI > 0.4, actual: `HDI=${meta.HDI.toFixed(2)}` };
    case 'independent-recover':
      return { pass: meta.independentRecoveries > 0 && meta.HDI < 0.5, actual: `indepRecover=${meta.independentRecoveries}, HDI=${meta.HDI.toFixed(2)}` };
    case 'idle':
      return { pass: !has('FACULTY_ALERT') && !has('SUPPORT_NOTIFY') && !has('DELIVER_INTERVENTION'), actual: `actions=${actions.join(',')}` };
    case 'cooldown':
      return { pass: (() => {
        // No two interventions may appear back-to-back (cooldown enforces a gap).
        for (let i = 0; i < actions.length - 1; i++) {
          if (actions[i].startsWith('DELIVER_INTERVENTION') && actions[i + 1].startsWith('DELIVER_INTERVENTION')) return false;
        }
        return actions.includes('DELIVER_INTERVENTION');
      })(), actual: `actions=${actions.join(',')}` };
    case 'integrity':
      return { pass: integrity.penalty > 0 && integrity.adjusted > integrity.baseRisk, actual: `penalty=${integrity.penalty}, adjusted=${integrity.adjusted} (base=${integrity.baseRisk})` };
    default:
      return { pass: false, actual: 'unknown scenario' };
  }
}

// POST /api/raise/test/run — execute S1–S9 and store results
router.post('/test/run', async (req, res) => {
  try {
    const results = [];
    await store.clearTestResults();
    for (const sc of SCENARIOS) {
      const studentId = `scenario-${sc.id}`;
      await store.resetStudent(studentId);
      const actions = [];
      const messages = [];
      let meta = {};
      let integrity = {};
      let prior = null;
      const steps = sc.steps || 9;
      for (let i = 0; i < steps; i++) {
        const step = simulateStep(sc, i, prior);
        const out = await raise.processAttempt({ studentId, ...step });
        actions.push(out.action);
        prior = out;
        meta = await raise.getDiagnostics(studentId);
        integrity = out.integrity || integrity;
        if (out.action === 'DELIVER_INTERVENTION') {
          const hint = await raise.requestHint({ studentId, question: 'test', currentProgress: step.progress });
          messages.push(`hint->${hint.level}`);
        }
        // Progress verification: count step recoveries as hint-mediated or independent.
        if (step.success) {
          await raise.verifyRecovery({ studentId, hintId: null, recovered: true, afterProgress: step.progress, independent: step.hintRequests === 0 });
        } else if (step.hintRequests > 0) {
          await raise.verifyRecovery({ studentId, hintId: null, recovered: false, afterProgress: step.progress, independent: false });
        }
      }
      const check = assertScenario(sc.type, actions, meta, integrity, messages);
      await store.addTestResult({
        scenarioId: sc.id,
        description: sc.description,
        expected: sc.type,
        actual: check.actual,
        pass: check.pass,
      });
      results.push({
        scenarioId: sc.id,
        description: sc.description,
        actual: check.actual,
        pass: check.pass,
        actions,
        HDI: meta.HDI,
        P_sr: meta.P_sr,
      });
    }
    const stored = await store.getTestResults();
    const passCount = stored.filter((r) => r.pass).length;
    res.json({ summary: { total: stored.length, passed: passCount }, results });
  } catch (err) {
    res.status(500).json({ error: 'Test run failed', details: err.message });
  }
});

// GET /api/raise/test/results — last test results
router.get('/test/results', async (req, res) => {
  try {
    const results = await store.getTestResults();
    const passCount = results.filter((r) => r.pass).length;
    res.json({ summary: { total: results.length, passed: passCount }, results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load test results', details: err.message });
  }
});

// POST /api/raise/compare — run 3 strategies across S1–S9 and aggregate
router.post('/compare', async (req, res) => {
  try {
    const strategies = ['BASELINE', 'RAISE', 'RAISE_NO_LEDGER'];
    const agg = {};
    for (const strategy of strategies) {
      agg[strategy] = { interventions: 0, supportNotifies: 0, facultyAlerts: 0, sumFriction: 0, count: 0, hintDependency: 0, hdiSum: 0, hdiCount: 0 };
      for (const sc of SCENARIOS) {
        const studentId = `scenario-${sc.id}`;
        await store.resetStudent(studentId);
        let lastOut = {};
        const steps = sc.steps || 9;
        let prior = null;
        for (let i = 0; i < steps; i++) {
          const step = simulateStep(sc, i, prior);
          // BASELINE: plain static friction thresholds, no ledger/HDI
          if (strategy === 'BASELINE') {
            if (step.rawFriction >= 50) agg[strategy].interventions++;
            if (step.rawFriction >= 80) agg[strategy].facultyAlerts++;
            agg[strategy].sumFriction += step.rawFriction;
            agg[strategy].count++;
            continue;
          }
          const noLedger = strategy === 'RAISE_NO_LEDGER';
          const out = await raise.processAttempt({
            studentId,
            ...step,
            hintRequests: noLedger ? 0 : step.hintRequests,
          });
          lastOut = out;
          prior = out;

          if (out.action === 'DELIVER_INTERVENTION') {
            agg[strategy].interventions++;
            // Full pipeline delivers a hint; ablation skips ledger/dependency tracking.
            await raise.requestHint({
              studentId,
              question: 'sim',
              currentProgress: step.progress,
              skipLedger: noLedger,
            });
          }
          if (!noLedger && step.success) {
            await raise.verifyRecovery({
              studentId, hintId: null, recovered: true,
              afterProgress: step.progress, independent: step.hintRequests === 0,
            });
          }
          if (out.action === 'SUPPORT_NOTIFY') agg[strategy].supportNotifies++;
          if (out.action === 'FACULTY_ALERT') agg[strategy].facultyAlerts++;
          agg[strategy].sumFriction += out.S_k;
          agg[strategy].count++;
          const diag = await raise.getDiagnostics(studentId);
          agg[strategy].hdiSum += diag.HDI || 0;
          agg[strategy].hdiCount += 1;
        }
      }
      const a = agg[strategy];
      a.hintDependency = Math.round((a.hdiSum / Math.max(1, a.hdiCount)) * 100) / 100;
      delete a.hdiSum;
      delete a.hdiCount;
      await store.addComparisonRow({
        strategy,
        scenarioId: 'ALL',
        interventions: a.interventions,
        supportNotifies: a.supportNotifies,
        facultyAlerts: a.facultyAlerts,
        avgFriction: Math.round(a.sumFriction / Math.max(1, a.count) * 10) / 10,
        hintDependency: a.hintDependency,
        integrityAdjust: 0,
      });
    }
    res.json({ strategies: agg });
  } catch (err) {
    res.status(500).json({ error: 'Comparison failed', details: err.message });
  }
});

// GET /api/raise/compare — last stored comparison
router.get('/compare', async (req, res) => {
  try {
    const rows = await store.getComparisonRows();
    res.json({ rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load comparison', details: err.message });
  }
});

// POST /api/raise/attempt — feed one RUN event
router.post('/attempt', async (req, res) => {
  try {
    const { studentId, rawFriction = 0, hintRequests = 0, success = true, progress = 0, baseIntegrityRisk = 0 } = req.body || {};
    if (!studentId) return res.status(400).json({ error: 'studentId is required' });
    const out = await raise.processAttempt({ studentId, rawFriction, hintRequests, success, progress, baseIntegrityRisk });
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: 'Attempt processing failed', details: err.message });
  }
});

// POST /api/raise/hint — request a hint (ledger recorded, level selected)
router.post('/hint', async (req, res) => {
  try {
    const { studentId, question = '', currentProgress = 0, hintLevelOverride = null } = req.body || {};
    if (!studentId) return res.status(400).json({ error: 'studentId is required' });
    const out = await raise.requestHint({ studentId, question, currentProgress, hintLevelOverride });
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: 'Hint request failed', details: err.message });
  }
});

// POST /api/raise/verify — verify recovery after a hint
router.post('/verify', async (req, res) => {
  try {
    const { studentId, hintId = null, recovered = false, afterProgress = 0, independent = false } = req.body || {};
    if (!studentId) return res.status(400).json({ error: 'studentId is required' });
    const out = await raise.verifyRecovery({ studentId, hintId, recovered, afterProgress, independent });
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

// GET /api/raise/state/:studentId — diagnostics
router.get('/state/:studentId', async (req, res) => {
  try {
    const diag = await raise.getDiagnostics(req.params.studentId);
    res.json(diag);
  } catch (err) {
    res.status(500).json({ error: 'State fetch failed', details: err.message });
  }
});

// GET /api/raise/ledger/:studentId — hint ledger
router.get('/ledger/:studentId', async (req, res) => {
  try {
    const ledger = await store.getHintLedger(req.params.studentId);
    res.json({ ledger });
  } catch (err) {
    res.status(500).json({ error: 'Ledger fetch failed', details: err.message });
  }
});

// GET /api/raise/evidence/:studentId — evidence log
router.get('/evidence/:studentId', async (req, res) => {
  try {
    const evidence = await store.getEvidence(req.params.studentId);
    res.json({ evidence });
  } catch (err) {
    res.status(500).json({ error: 'Evidence fetch failed', details: err.message });
  }
});

module.exports = router;