const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'raise_engine.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening RAISE SQLite database:', err.message);
  } else {
    console.log('Connected to RAISE Engine SQLite database.');
  }
});

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

async function init() {
  await run(`CREATE TABLE IF NOT EXISTS raise_states (
    student_id TEXT PRIMARY KEY,
    S_k REAL DEFAULT 0,
    M_k REAL DEFAULT 0,
    attempts_since_last_intervention INTEGER DEFAULT 100,
    pending_evaluation TEXT,
    raw_friction_count INTEGER DEFAULT 0,
    hint_requests_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    consecutive_fails INTEGER DEFAULT 0,
    q_table TEXT,
    independent_recovery_count INTEGER DEFAULT 0,
    hint_mediated_recovery_count INTEGER DEFAULT 0,
    consistent_progress REAL DEFAULT 0,
    verified_progress REAL DEFAULT 0,
    last_friction REAL DEFAULT 0,
    last_momentum REAL DEFAULT 0,
    last_stuck INTEGER DEFAULT 0,
    last_hint_level TEXT DEFAULT NULL,
    last_action TEXT DEFAULT NULL,
    last_decision_reason TEXT DEFAULT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS raise_hint_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    hint_level TEXT,
    hint_content TEXT,
    question TEXT,
    before_progress REAL,
    after_progress REAL,
    progress_delta REAL,
    outcome TEXT,
    recovered INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS raise_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    event_type TEXT,
    decision TEXT,
    contributing_signals TEXT,
    scores TEXT,
    hint_reference INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS raise_test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id TEXT,
    description TEXT,
    expected TEXT,
    actual TEXT,
    pass INTEGER,
    run_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS raise_comparison (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    strategy TEXT,
    scenario_id TEXT,
    interventions REAL,
    support_notifies REAL,
    faculty_alerts REAL,
    avg_friction REAL,
    hint_dependency REAL,
    integrity_adjust REAL,
    run_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  const cols = await all(`PRAGMA table_info(raise_states)`);
  if (!cols.some((c) => c.name === 'consecutive_fails')) {
    await run(`ALTER TABLE raise_states ADD COLUMN consecutive_fails INTEGER DEFAULT 0`);
  }
}

async function getState(studentId) {
  const row = await get('SELECT * FROM raise_states WHERE student_id = ?', [studentId]);
  if (!row) return null;
  return {
    ...row,
    pending_evaluation: row.pending_evaluation ? JSON.parse(row.pending_evaluation) : null,
    q: row.q_table ? JSON.parse(row.q_table) : null,
  };
}

async function upsertState(studentId, state) {
  const existing = await get('SELECT student_id FROM raise_states WHERE student_id = ?', [studentId]);
  const payload = {
    S_k: state.S_k || 0,
    M_k: state.M_k || 0,
    attempts_since_last_intervention: state.attemptsSinceLastIntervention ?? 100,
    pending_evaluation: state.pendingEvaluation ? JSON.stringify(state.pendingEvaluation) : null,
    raw_friction_count: state.rawFrictionCount || 0,
    hint_requests_count: state.hintRequestsCount || 0,
    success_count: state.successCount || 0,
    fail_count: state.failCount || 0,
    consecutive_fails: state.consecutiveFails || 0,
    q_table: state.q ? JSON.stringify(state.q) : JSON.stringify({ l1: 20, l2: 30, l3: 40 }),
    independent_recovery_count: state.independentRecoveryCount || 0,
    hint_mediated_recovery_count: state.hintMediatedRecoveryCount || 0,
    consistent_progress: state.consistentProgress || 0,
    verified_progress: state.verifiedProgress || 0,
    last_friction: state.lastFriction || 0,
    last_momentum: state.lastMomentum || 0,
    last_stuck: state.lastStuck ? 1 : 0,
    last_hint_level: state.lastHintLevel || null,
    last_action: state.lastAction || null,
    last_decision_reason: state.lastDecisionReason || null,
  };
  if (existing) {
    await run(
      `UPDATE raise_states SET
        S_k=?, M_k=?,
        attempts_since_last_intervention=?,
        pending_evaluation=?,
        raw_friction_count=?,
        hint_requests_count=?,
        success_count=?,
        fail_count=?,
        consecutive_fails=?,
        q_table=?,
        independent_recovery_count=?,
        hint_mediated_recovery_count=?,
        consistent_progress=?,
        verified_progress=?,
        last_friction=?,
        last_momentum=?,
        last_stuck=?,
        last_hint_level=?,
        last_action=?,
        last_decision_reason=?,
        updated_at=CURRENT_TIMESTAMP
      WHERE student_id=?`,
      [
        payload.S_k, payload.M_k,
        payload.attempts_since_last_intervention,
        payload.pending_evaluation,
        payload.raw_friction_count,
        payload.hint_requests_count,
        payload.success_count,
        payload.fail_count,
        payload.consecutive_fails,
        payload.q_table,
        payload.independent_recovery_count,
        payload.hint_mediated_recovery_count,
        payload.consistent_progress,
        payload.verified_progress,
        payload.last_friction,
        payload.last_momentum,
        payload.last_stuck,
        payload.last_hint_level,
        payload.last_action,
        payload.last_decision_reason,
        studentId,
      ]
    );
  } else {
    await run(
      `INSERT INTO raise_states (student_id, S_k, M_k, attempts_since_last_intervention, pending_evaluation,
        raw_friction_count, hint_requests_count, success_count, fail_count, consecutive_fails, q_table,
        independent_recovery_count, hint_mediated_recovery_count,
        consistent_progress, verified_progress, last_friction, last_momentum, last_stuck,
        last_hint_level, last_action, last_decision_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        payload.S_k, payload.M_k,
        payload.attempts_since_last_intervention,
        payload.pending_evaluation,
        payload.raw_friction_count,
        payload.hint_requests_count,
        payload.success_count,
        payload.fail_count,
        payload.consecutive_fails,
        payload.q_table,
        payload.independent_recovery_count,
        payload.hint_mediated_recovery_count,
        payload.consistent_progress,
        payload.verified_progress,
        payload.last_friction,
        payload.last_momentum,
        payload.last_stuck,
        payload.last_hint_level,
        payload.last_action,
        payload.last_decision_reason,
      ]
    );
  }
}

async function addHintLedger(entry) {
  return run(
    `INSERT INTO raise_hint_ledger (student_id, hint_level, hint_content, question,
      before_progress, after_progress, progress_delta, outcome, recovered)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.studentId,
      entry.hintLevel,
      entry.hintContent || '',
      entry.question || '',
      entry.beforeProgress || 0,
      entry.afterProgress || 0,
      entry.progressDelta || 0,
      entry.outcome || 'PENDING',
      entry.recovered ? 1 : 0,
    ]
  );
}

async function updateHintLedger(id, patch) {
  const current = await get('SELECT * FROM raise_hint_ledger WHERE id = ?', [id]);
  if (!current) return null;
  return run(
    `UPDATE raise_hint_ledger SET
      after_progress=?, progress_delta=?, outcome=?, recovered=?
      WHERE id=?`,
    [
      patch.afterProgress ?? current.after_progress,
      patch.progressDelta ?? current.progress_delta,
      patch.outcome ?? current.outcome,
      patch.recovered ? 1 : current.recovered,
      id,
    ]
  );
}

async function getHintLedger(studentId, limit = 100) {
  const rows = await all(
    `SELECT * FROM raise_hint_ledger WHERE student_id = ? ORDER BY id DESC LIMIT ?`,
    [studentId, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    studentId: r.student_id,
    hintLevel: r.hint_level,
    hintContent: r.hint_content,
    question: r.question,
    beforeProgress: r.before_progress,
    afterProgress: r.after_progress,
    progressDelta: r.progress_delta,
    outcome: r.outcome,
    recovered: !!r.recovered,
    createdAt: r.created_at,
  }));
}

async function addEvidence(entry) {
  return run(
    `INSERT INTO raise_evidence (student_id, event_type, decision, contributing_signals, scores, hint_reference)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entry.studentId,
      entry.eventType,
      entry.decision,
      JSON.stringify(entry.contributingSignals || {}),
      JSON.stringify(entry.scores || {}),
      entry.hintReference || null,
    ]
  );
}

async function getEvidence(studentId, limit = 100) {
  const rows = await all(
    `SELECT * FROM raise_evidence WHERE student_id = ? ORDER BY id DESC LIMIT ?`,
    [studentId, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    studentId: r.student_id,
    eventType: r.event_type,
    decision: r.decision,
    contributingSignals: JSON.parse(r.contributing_signals || '{}'),
    scores: JSON.parse(r.scores || '{}'),
    hintReference: r.hint_reference,
    createdAt: r.created_at,
  }));
}

async function addTestResult(r) {
  return run(
    `INSERT INTO raise_test_results (scenario_id, description, expected, actual, pass)
    VALUES (?, ?, ?, ?, ?)`,
    [r.scenarioId, r.description, r.expected, r.actual, r.pass ? 1 : 0]
  );
}

async function getTestResults() {
  const rows = await all(`SELECT * FROM raise_test_results ORDER BY id ASC`);
  return rows.map((r) => ({
    id: r.id,
    scenarioId: r.scenario_id,
    description: r.description,
    expected: r.expected,
    actual: r.actual,
    pass: !!r.pass,
    runAt: r.run_at,
  }));
}

async function clearTestResults() {
  return run(`DELETE FROM raise_test_results`);
}

async function addComparisonRow(r) {
  return run(
    `INSERT INTO raise_comparison (strategy, scenario_id, interventions, support_notifies, faculty_alerts,
      avg_friction, hint_dependency, integrity_adjust)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [r.strategy, r.scenarioId, r.interventions, r.supportNotifies, r.facultyAlerts, r.avgFriction, r.hintDependency, r.integrityAdjust]
  );
}

async function getComparisonRows() {
  const rows = await all(`SELECT * FROM raise_comparison ORDER BY id ASC`);
  return rows.map((r) => ({
    id: r.id,
    strategy: r.strategy,
    scenarioId: r.scenario_id,
    interventions: r.interventions,
    supportNotifies: r.support_notifies,
    facultyAlerts: r.faculty_alerts,
    avgFriction: r.avg_friction,
    hintDependency: r.hint_dependency,
    integrityAdjust: r.integrity_adjust,
    runAt: r.run_at,
  }));
}

async function resetStudent(studentId) {
  await run('DELETE FROM raise_states WHERE student_id = ?', [studentId]);
  await run('DELETE FROM raise_hint_ledger WHERE student_id = ?', [studentId]);
  await run('DELETE FROM raise_evidence WHERE student_id = ?', [studentId]);
}

module.exports = {
  init,
  getState,
  upsertState,
  addHintLedger,
  updateHintLedger,
  getHintLedger,
  addEvidence,
  getEvidence,
  addTestResult,
  getTestResults,
  clearTestResults,
  addComparisonRow,
  getComparisonRows,
  resetStudent,
};